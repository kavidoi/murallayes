import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { User as APIUser } from '../../../../../types'
import type { TaskAssignee } from '../../types/tasks'

interface AssigneeSelectorProps {
  users: APIUser[]
  selectedAssignees: TaskAssignee[]
  onAssigneesChange: (assignees: TaskAssignee[]) => void
  maxAssignees?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  placeholder?: string
  className?: string
}

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UserPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

// Convert API user to TaskAssignee format
function userToAssignee(user: APIUser): TaskAssignee {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }
}

// Avatar component
function AssigneeAvatar({ 
  assignee, 
  size = 'md', 
  showRemove = false, 
  onRemove 
}: { 
  assignee: TaskAssignee
  size?: 'sm' | 'md' | 'lg'
  showRemove?: boolean
  onRemove?: () => void
}) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  return (
    <div className="relative inline-flex">
      <div
        className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white 
                   flex items-center justify-center border-2 border-white 
                   dark:border-neutral-800 font-medium`}
        title={`${assignee.name} (${assignee.email})`}
      >
        {assignee.initials}
      </div>
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 
                     text-white rounded-full flex items-center justify-center
                     transition-colors"
          title="Remover asignado"
        >
          <XIcon />
        </button>
      )}
    </div>
  )
}

export function AssigneeSelector({
  users,
  selectedAssignees,
  onAssigneesChange,
  maxAssignees = 5,
  disabled = false,
  size = 'md',
  showLabels = true,
  placeholder,
  className = ''
}: AssigneeSelectorProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter available users
  const availableUsers = users.filter(user => {
    const isAlreadySelected = selectedAssignees.some(assignee => assignee.id === user.id)
    if (isAlreadySelected) return false
    
    if (!searchTerm) return true
    
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    const email = user.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    
    return fullName.includes(search) || email.includes(search)
  })

  const handleToggleAssignee = (user: APIUser) => {
    const assignee = userToAssignee(user)
    const isSelected = selectedAssignees.some(a => a.id === assignee.id)
    
    if (isSelected) {
      onAssigneesChange(selectedAssignees.filter(a => a.id !== assignee.id))
    } else if (selectedAssignees.length < maxAssignees) {
      onAssigneesChange([...selectedAssignees, assignee])
    }
    
    setSearchTerm('')
  }

  const handleRemoveAssignee = (assigneeId: string) => {
    onAssigneesChange(selectedAssignees.filter(a => a.id !== assigneeId))
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showLabels && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {t('tasksV2.assignee.label')}
        </label>
      )}
      
      {/* Selected assignees and trigger */}
      <div
        onClick={toggleDropdown}
        className={`flex items-center justify-between min-h-[40px] px-3 py-2 
                   bg-white dark:bg-neutral-800 border border-neutral-300 
                   dark:border-neutral-600 rounded-lg cursor-pointer
                   transition-colors
                   ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
                   ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1">
          {selectedAssignees.length === 0 ? (
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <UserPlusIcon />
              <span className="text-sm">
                {placeholder || t('tasksV2.assignee.placeholder')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedAssignees.slice(0, 3).map(assignee => (
                <AssigneeAvatar
                  key={assignee.id}
                  assignee={assignee}
                  size={size}
                  showRemove={!disabled}
                  onRemove={() => handleRemoveAssignee(assignee.id)}
                />
              ))}
              {selectedAssignees.length > 3 && (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 px-2 py-1 
                               bg-neutral-100 dark:bg-neutral-700 rounded">
                  +{selectedAssignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        
        {!disabled && (
          <ChevronDownIcon />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 
                       border border-neutral-300 dark:border-neutral-600 
                       rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('tasksV2.assignee.searchPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 
                         dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 
                         text-neutral-900 dark:text-white
                         placeholder-neutral-500 dark:placeholder-neutral-400
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Available users list */}
          <div className="max-h-48 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <div className="p-3 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                {searchTerm ? t('tasksV2.assignee.noResults') : t('tasksV2.assignee.allAssigned')}
              </div>
            ) : (
              <div className="py-1">
                {availableUsers.map(user => {
                  const assignee = userToAssignee(user)
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleToggleAssignee(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left
                                hover:bg-neutral-50 dark:hover:bg-neutral-700 
                                transition-colors"
                    >
                      <AssigneeAvatar assignee={assignee} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {assignee.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {assignee.email}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer info */}
          {selectedAssignees.length > 0 && (
            <div className="p-2 bg-neutral-50 dark:bg-neutral-700 border-t 
                           border-neutral-200 dark:border-neutral-600">
              <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
                {t('tasksV2.assignee.selectedCount', { 
                  count: selectedAssignees.length, 
                  max: maxAssignees 
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AssigneeSelector