import { useState, useEffect, useCallback } from 'react'
import { tasksService, type Task as APITask } from '../../../../services/tasksService'
import { projectsService, type Project as APIProject } from '../../../../services/projectsService'
import { usersService } from '../../../../services/usersService'
import type { User as APIUser } from '../../../../types'
import type { TaskV2, TaskFilters, TaskAssignee } from '../types/tasks'

// Convert API task to clean TaskV2 format
function convertToTaskV2(
  apiTask: APITask, 
  projects: APIProject[], 
  users: APIUser[]
): TaskV2 {
  const project = projects.find(p => p.id === apiTask.projectId)
  const assignees: TaskAssignee[] = apiTask.assignees?.map(a => ({
    id: a.user.id,
    name: `${a.user.firstName} ${a.user.lastName}`.trim(),
    email: a.user.email,
    initials: `${a.user.firstName?.[0] || ''}${a.user.lastName?.[0] || ''}`.toUpperCase()
  })) || []

  // Check if task is overdue
  const isOverdue = apiTask.dueDate && apiTask.status !== 'DONE' 
    ? new Date(apiTask.dueDate) < new Date() 
    : false

  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    status: apiTask.status,
    priority: apiTask.priority,
    projectId: apiTask.projectId,
    projectName: project?.name,
    assignees,
    dueDate: apiTask.dueDate,
    createdAt: apiTask.createdAt,
    updatedAt: apiTask.updatedAt,
    orderIndex: apiTask.orderIndex,
    isOverdue
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskV2[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<APIProject[]>([])
  const [users, setUsers] = useState<APIUser[]>([])

  // Load all data
  const loadTasks = useCallback(async (force = false) => {
    if (!force && tasks.length > 0) return

    try {
      setLoading(true)
      setError(null)

      // Load all data in parallel
      const [tasksData, projectsData, usersData] = await Promise.all([
        tasksService.getAllTasks(),
        projectsService.getAllProjects(),
        usersService.getActiveUsers()
      ])

      // Convert to clean format
      const cleanTasks = tasksData.map(task => 
        convertToTaskV2(task, projectsData, usersData)
      )

      setTasks(cleanTasks)
      setProjects(projectsData)
      setUsers(usersData)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [tasks.length])

  // Refresh tasks
  const refreshTasks = useCallback(() => {
    loadTasks(true)
  }, [loadTasks])

  // Get filtered tasks
  const getFilteredTasks = useCallback((filters: TaskFilters) => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(searchLower)
        const matchesDescription = task.description?.toLowerCase().includes(searchLower)
        const matchesProject = task.projectName?.toLowerCase().includes(searchLower)
        
        if (!matchesTitle && !matchesDescription && !matchesProject) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false
      }

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned') {
          if (task.assignees.length > 0) return false
        } else {
          if (!task.assignees.some(a => a.id === filters.assignee)) return false
        }
      }

      // Project filter
      if (filters.project !== 'all' && task.projectId !== filters.project) {
        return false
      }

      // Overdue filter
      if (filters.overdue && !task.isOverdue) {
        return false
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false
      }

      return true
    })
  }, [tasks])

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return {
    tasks,
    loading,
    error,
    projects,
    users,
    refreshTasks,
    getFilteredTasks
  }
}