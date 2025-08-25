// Types for export functionality
import { User } from '../services/authService';
import { Task, Subtask, APIProject } from '../types/common';

export interface ExportData {
  tasks: Task[]
  projects: APIProject[]
  users: User[]
  exportDate: string
  version: string
}

export type ExportFormat = 'json' | 'csv' | 'excel'

// Utility to download a file
const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Format date for filenames
const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

// Export as JSON
export const exportAsJSON = (data: ExportData): void => {
  const jsonContent = JSON.stringify(data, null, 2)
  const filename = `muralla-tasks-backup-${formatDateForFilename(new Date())}.json`
  downloadFile(jsonContent, filename, 'application/json')
}

// Convert task data to CSV rows
const taskToCSVRow = (task: Task, projects: APIProject[], users: User[]): string[] => {
  const project = projects.find(p => p.id === task.projectId)
  const assignees = task.assigneeIds?.map(id => {
    const user = users.find(u => u.id === id)
    return user?.name || id
  }).join('; ') || ''

  return [
    task.id,
    task.name,
    task.description || '',
    task.status,
    task.priority || '',
    project?.name || '',
    assignees,
    task.dueDate || '',
    task.createdAt || '',
    task.updatedAt || '',
    task.subtasks?.length.toString() || '0'
  ]
}

// Convert subtask data to CSV rows
const subtaskToCSVRow = (subtask: Subtask, parentTask: Task, projects: APIProject[]): string[] => {
  const project = projects.find(p => p.id === parentTask.projectId)
  
  return [
    subtask.id,
    subtask.name,
    subtask.description || '',
    subtask.status,
    'Subtask',
    project?.name || '',
    parentTask.name,
    '',
    subtask.createdAt || '',
    subtask.updatedAt || '',
    '0'
  ]
}

// Export as CSV
export const exportAsCSV = (data: ExportData): void => {
  const headers = [
    'ID',
    'Name',
    'Description',
    'Status',
    'Priority',
    'Project',
    'Assignees',
    'Due Date',
    'Created At',
    'Updated At',
    'Subtasks Count'
  ]

  const rows: string[][] = [headers]

  // Add tasks
  data.tasks.forEach(task => {
    rows.push(taskToCSVRow(task, data.projects, data.users))
    
    // Add subtasks
    task.subtasks?.forEach(subtask => {
      rows.push(subtaskToCSVRow(subtask, task, data.projects))
    })
  })

  // Convert to CSV string
  const csvContent = rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n')

  const filename = `muralla-tasks-export-${formatDateForFilename(new Date())}.csv`
  downloadFile(csvContent, filename, 'text/csv')
}

// Export as Excel (using CSV format with .xlsx extension for simplicity)
export const exportAsExcel = (data: ExportData): void => {
  // For a full Excel implementation, we'd need a library like xlsx
  // For now, we'll export as CSV with .xlsx extension
  const headers = [
    'ID',
    'Name',
    'Description',
    'Status',
    'Priority',
    'Project',
    'Assignees',
    'Due Date',
    'Created At',
    'Updated At',
    'Type',
    'Parent Task'
  ]

  const rows: string[][] = [headers]

  // Add tasks
  data.tasks.forEach(task => {
    const project = data.projects.find(p => p.id === task.projectId)
    const assignees = task.assigneeIds?.map(id => {
      const user = data.users.find(u => u.id === id)
      return user?.name || id
    }).join('; ') || ''

    rows.push([
      task.id,
      task.name,
      task.description || '',
      task.status,
      task.priority || '',
      project?.name || '',
      assignees,
      task.dueDate || '',
      task.createdAt || '',
      task.updatedAt || '',
      'Task',
      ''
    ])
    
    // Add subtasks
    task.subtasks?.forEach(subtask => {
      rows.push([
        subtask.id,
        subtask.name,
        subtask.description || '',
        subtask.status,
        '',
        project?.name || '',
        '',
        '',
        subtask.createdAt || '',
        subtask.updatedAt || '',
        'Subtask',
        task.name
      ])
    })
  })

  // Convert to CSV string (Excel can open CSV files)
  const csvContent = rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n')

  const filename = `muralla-tasks-export-${formatDateForFilename(new Date())}.xlsx`
  downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

// Main export function
export const exportTasks = (
  tasks: Task[],
  projects: APIProject[],
  users: User[],
  format: ExportFormat
): void => {
  const exportData: ExportData = {
    tasks,
    projects,
    users,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  }

  switch (format) {
    case 'json':
      exportAsJSON(exportData)
      break
    case 'csv':
      exportAsCSV(exportData)
      break
    case 'excel':
      exportAsExcel(exportData)
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

// Import function for JSON format
export const importTasksFromJSON = (jsonContent: string): ExportData => {
  try {
    const data = JSON.parse(jsonContent) as ExportData
    
    // Validate the structure
    if (!data.tasks || !Array.isArray(data.tasks)) {
      throw new Error('Invalid JSON structure: missing tasks array')
    }
    
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Invalid JSON structure: missing projects array')
    }
    
    if (!data.users || !Array.isArray(data.users)) {
      throw new Error('Invalid JSON structure: missing users array')
    }
    
    return data
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Generate export summary
export const generateExportSummary = (data: ExportData): string => {
  const taskCount = data.tasks.length
  const subtaskCount = data.tasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0)
  const projectCount = data.projects.length
  const userCount = data.users.length
  
  return `Export Summary:
- ${taskCount} tasks
- ${subtaskCount} subtasks
- ${projectCount} projects
- ${userCount} users
- Exported on: ${new Date(data.exportDate).toLocaleString()}
- Version: ${data.version}`
}
