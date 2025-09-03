import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskEditModal } from '../TaskEditModal'

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockTask = {
  id: '1',
  title: 'Test Task',
  name: 'Test Task',
  description: 'Test Description',
  status: 'Nuevo' as const,
  priority: 'MEDIUM' as const,
  dueDate: '2024-12-31',
  assignedTo: 'user1',
  assigneeIds: ['user1'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  projectId: 'project1',
  project: { id: 'project1', name: 'Test Project' },
  tags: ['tag1'],
  estimatedHours: 8,
  actualHours: 0,
  completedAt: null,
  createdBy: 'user1',
  parentTaskId: null,
  subtasks: [],
  comments: [],
  attachments: [],
  order: 0,
  statusModifiedByUser: false,
  wasEnProgreso: false
}

const mockUsers = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
]

const mockProjects = [
  { id: 'project1', name: 'Test Project', description: 'Test' }
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  task: mockTask,
  users: mockUsers,
  projects: mockProjects
}

describe('TaskEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when open', () => {
    render(<TaskEditModal {...defaultProps} />)
    
    expect(screen.getByText('tasks.edit')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<TaskEditModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('tasks.edit')).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskEditModal {...defaultProps} />)
    
    const cancelButton = screen.getByText('common.cancel')
    await user.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('calls onSave with updated task data when save button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskEditModal {...defaultProps} />)
    
    // Update the title
    const titleInput = screen.getByDisplayValue('Test Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task Title')
    
    // Click save
    const saveButton = screen.getByText('common.save')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTask,
          title: 'Updated Task Title'
        })
      )
    })
  })

  it('updates task status when status dropdown changes', async () => {
    const user = userEvent.setup()
    render(<TaskEditModal {...defaultProps} />)
    
    // Find and click status dropdown
    const statusSelect = screen.getByDisplayValue('TODO')
    await user.selectOptions(statusSelect, 'IN_PROGRESS')
    
    // Click save
    const saveButton = screen.getByText('common.save')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTask,
          status: 'IN_PROGRESS'
        })
      )
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<TaskEditModal {...defaultProps} />)
    
    // Clear the title (required field)
    const titleInput = screen.getByDisplayValue('Test Task')
    await user.clear(titleInput)
    
    // Try to save
    const saveButton = screen.getByText('common.save')
    await user.click(saveButton)
    
    // Should not call onSave if validation fails
    expect(defaultProps.onSave).not.toHaveBeenCalled()
  })

  it('handles new task creation', () => {
    const newTaskProps = {
      ...defaultProps,
      task: mockTask
    }
    
    render(<TaskEditModal {...newTaskProps} />)
    
    expect(screen.getByText('tasks.create')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tasks.titlePlaceholder')).toBeInTheDocument()
  })
})
