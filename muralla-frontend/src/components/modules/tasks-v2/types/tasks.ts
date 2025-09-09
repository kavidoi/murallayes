// Clean type definitions for TasksV2
export interface TaskV2 {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  projectId: string
  projectName?: string
  assignees: TaskAssignee[]
  dueDate?: string
  createdAt: string
  updatedAt: string
  orderIndex: number
  subtasks?: TaskV2[]
  isOverdue?: boolean
}

export interface TaskAssignee {
  id: string
  name: string
  email: string
  initials: string
}

export interface TaskFilters {
  search: string
  status: string // 'all' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  assignee: string // 'all' | 'unassigned' | userId
  project: string // 'all' | projectId
  overdue: boolean
  priority: string // 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export interface TasksV2State {
  tasks: TaskV2[]
  loading: boolean
  error: string | null
  filters: TaskFilters
  selectedTasks: string[]
  viewMode: 'list' | 'kanban' | 'calendar'
}

export interface CreateTaskV2Data {
  title: string
  description?: string
  projectId: string
  assigneeIds?: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
}

export interface UpdateTaskV2Data {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  projectId?: string
  assigneeIds?: string[]
  dueDate?: string
}

// UI-specific types
export interface TaskAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (taskId: string) => void
  variant?: 'default' | 'danger'
  shortcut?: string
}

export interface BulkAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (taskIds: string[]) => void
  variant?: 'default' | 'danger'
  requiresConfirmation?: boolean
}