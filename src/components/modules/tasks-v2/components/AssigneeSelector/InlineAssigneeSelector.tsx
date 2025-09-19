import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AssigneeSelector } from './AssigneeSelector'
import type { User as APIUser } from '../../../../../types'
import type { TaskAssignee } from '../../types/tasks'

interface InlineAssigneeSelectorProps {
  users: APIUser[]
  assignees: TaskAssignee[]
  onAssigneesChange: (assignees: TaskAssignee[]) => void
  loading?: boolean
  disabled?: boolean
  maxVisible?: number
}

const UserPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

// Compact assignee avatar
function CompactAssigneeAvatar({ assignee }: { assignee: TaskAssignee }) {
  return (
    <div
      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs 
                 flex items-center justify-center border-2 border-white 
                 dark:border-neutral-800 font-medium"
      title={`${assignee.name} (${assignee.email})`}
    >
      {assignee.initials}
    </div>
  )
}

export function InlineAssigneeSelector({
  users,
  assignees,
  onAssigneesChange,
  loading = false,
  disabled = false,
  maxVisible = 3
}: InlineAssigneeSelectorProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)

  const handleAssigneesChange = (newAssignees: TaskAssignee[]) => {
    onAssigneesChange(newAssignees)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="min-w-[200px]">
        <AssigneeSelector
          users={users}
          selectedAssignees={assignees}
          onAssigneesChange={handleAssigneesChange}
          disabled={disabled || loading}
          size="sm"
          showLabels={false}
          placeholder={t('tasksV2.assignee.selectPlaceholder')}
        />
      </div>
    )
  }

  // Display mode
  if (assignees.length === 0) {
    return (
      <button
        onClick={() => !disabled && !loading && setIsEditing(true)}
        disabled={disabled || loading}
        className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 
                   dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300
                   hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('tasksV2.assignee.clickToAssign')}
      >
        <UserPlusIcon />
        <span>{t('tasksV2.assignee.unassigned')}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => !disabled && !loading && setIsEditing(true)}
      disabled={disabled || loading}
      className="flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 
                 rounded p-1 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
      title={t('tasksV2.assignee.clickToEdit')}
    >
      <div className="flex -space-x-1">
        {assignees.slice(0, maxVisible).map(assignee => (
          <CompactAssigneeAvatar key={assignee.id} assignee={assignee} />
        ))}
        {assignees.length > maxVisible && (
          <div className="w-6 h-6 rounded-full bg-neutral-400 text-white text-xs 
                         flex items-center justify-center border-2 border-white 
                         dark:border-neutral-800 font-medium">
            +{assignees.length - maxVisible}
          </div>
        )}
      </div>
      
      {/* Edit hint - shows on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    </button>
  )
}

export default InlineAssigneeSelector