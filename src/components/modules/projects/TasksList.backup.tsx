import React, { useState, useEffect } from 'react'
import { tasksService, type Task } from '../../../services/tasksService'
import { usersService } from '../../../services/usersService' 
import { projectsService, type Project } from '../../../services/projectsService'
import type { User } from '../../../types'

interface TasksListProps {}

const TasksList: React.FC<TasksListProps> = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load all necessary data
        const [tasksData, usersData, projectsData] = await Promise.all([
          tasksService.getAllTasks(),
          usersService.getActiveUsers(),
          projectsService.getAllProjects()
        ])

        setTasks(tasksData)
        setUsers(usersData)
        setProjects(projectsData)
        setError(null)
      } catch (err) {
        console.error('Failed to load tasks data:', err)
        setError('Failed to load tasks. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-600'
      case 'MEDIUM':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Tasks</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600">Manage your tasks and projects</p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">Get started by creating your first task</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              All Tasks ({tasks.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-4 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`inline-flex items-center ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.project && (
                        <span className="text-gray-500">
                          📁 {task.project.name}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="text-gray-500">
                          👤 {task.assignee.name || task.assignee.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {task.dueDate && (
                      <div className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksList