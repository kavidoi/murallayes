import { useCallback, useState } from 'react'
import { tasksService } from '../../../../services/tasksService'
import type { CreateTaskV2Data, UpdateTaskV2Data, TaskV2 } from '../types/tasks'

export function useTaskActions(onTasksChange: () => void) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Create task
  const createTask = useCallback(async (data: CreateTaskV2Data): Promise<TaskV2 | null> => {
    try {
      setActionLoading('create')
      setActionError(null)

      const createDto = {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeIds?.[0], // API currently supports single assignee
        ...(data.dueDate && { dueDate: data.dueDate })
      }

      const newTask = await tasksService.createTask(createDto)
      
      // Handle multiple assignees if provided
      if (data.assigneeIds && data.assigneeIds.length > 1) {
        await tasksService.updateTaskAssignees(newTask.id, data.assigneeIds)
      }

      onTasksChange()
      return newTask as TaskV2
    } catch (error) {
      console.error('Failed to create task:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to create task')
      return null
    } finally {
      setActionLoading(null)
    }
  }, [onTasksChange])

  // Update task
  const updateTask = useCallback(async (taskId: string, data: UpdateTaskV2Data): Promise<boolean> => {
    try {
      setActionLoading(taskId)
      setActionError(null)

      // Update basic task properties
      const updateDto = {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.projectId && { projectId: data.projectId }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate })
      }

      if (Object.keys(updateDto).length > 0) {
        await tasksService.updateTask(taskId, updateDto)
      }

      // Update assignees if provided
      if (data.assigneeIds !== undefined) {
        await tasksService.updateTaskAssignees(taskId, data.assigneeIds)
      }

      onTasksChange()
      return true
    } catch (error) {
      console.error('Failed to update task:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to update task')
      return false
    } finally {
      setActionLoading(null)
    }
  }, [onTasksChange])

  // Delete task
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setActionLoading(taskId)
      setActionError(null)

      await tasksService.deleteTask(taskId)
      onTasksChange()
      return true
    } catch (error) {
      console.error('Failed to delete task:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to delete task')
      return false
    } finally {
      setActionLoading(null)
    }
  }, [onTasksChange])

  // Update task status (quick action)
  const updateTaskStatus = useCallback(async (
    taskId: string, 
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  ): Promise<boolean> => {
    return updateTask(taskId, { status })
  }, [updateTask])

  // Update task assignees (quick action)
  const updateTaskAssignees = useCallback(async (taskId: string, assigneeIds: string[]): Promise<boolean> => {
    return updateTask(taskId, { assigneeIds })
  }, [updateTask])

  // Bulk operations
  const bulkUpdateStatus = useCallback(async (
    taskIds: string[], 
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  ): Promise<boolean> => {
    try {
      setActionLoading('bulk')
      setActionError(null)

      // Update tasks in parallel
      const promises = taskIds.map(taskId => tasksService.updateTask(taskId, { status }))
      await Promise.all(promises)

      onTasksChange()
      return true
    } catch (error) {
      console.error('Failed to bulk update status:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to update tasks')
      return false
    } finally {
      setActionLoading(null)
    }
  }, [onTasksChange])

  const bulkDelete = useCallback(async (taskIds: string[]): Promise<boolean> => {
    try {
      setActionLoading('bulk')
      setActionError(null)

      // Delete tasks in parallel
      const promises = taskIds.map(taskId => tasksService.deleteTask(taskId))
      await Promise.all(promises)

      onTasksChange()
      return true
    } catch (error) {
      console.error('Failed to bulk delete:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to delete tasks')
      return false
    } finally {
      setActionLoading(null)
    }
  }, [onTasksChange])

  // Clear errors
  const clearError = useCallback(() => {
    setActionError(null)
  }, [])

  return {
    // Individual actions
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskAssignees,
    
    // Bulk actions
    bulkUpdateStatus,
    bulkDelete,
    
    // State
    actionLoading,
    actionError,
    clearError,
    
    // Helpers
    isLoading: (taskId?: string) => actionLoading === taskId || actionLoading === 'bulk' || actionLoading === 'create'
  }
}