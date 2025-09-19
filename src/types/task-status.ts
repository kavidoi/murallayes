// New intelligent task status system
export type TaskStatus = 
  | 'Limite'      // Due date is today (unless created today)
  | 'Postergado'  // Was "En progreso" AND deadline modified today
  | 'Revisar'     // Was "En progreso" AND deadline NOT modified today
  | 'En progreso' // User manually set this status
  | 'Empezar'     // >1 day old since creation AND user hasn't set "En progreso"
  | 'Nuevo'       // Created today AND user hasn't set "En progreso"
  | 'Listo';      // Task completed (final state)

// Legacy status mapping for API compatibility
export type APITaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface TaskTimestamps {
  createdAt: string;
  dueDateModifiedAt?: string;
  statusModifiedByUser: boolean;
  wasEnProgreso: boolean; // Track if task was previously "En progreso"
}

export interface TaskWithIntelligentStatus {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  status: APITaskStatus; // Backend status
  createdAt: string;
  dueDateModifiedAt?: string;
  statusModifiedByUser: boolean;
  wasEnProgreso: boolean;
  // ... other task fields
}

/**
 * Calculate intelligent task status based on timestamps and user interactions
 */
export function calculateTaskStatus(task: TaskWithIntelligentStatus): TaskStatus {
  const today = new Date().toISOString().split('T')[0];
  const createdToday = task.createdAt.split('T')[0] === today;
  const dueDateToday = task.dueDate === today;
  const dueDateModifiedToday = task.dueDateModifiedAt?.split('T')[0] === today;
  
  const createdAt = new Date(task.createdAt);
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Priority order as specified
  if (task.status === 'DONE') return 'Listo';
  
  if (dueDateToday && !createdToday) return 'Limite';
  
  if (task.wasEnProgreso && dueDateModifiedToday) return 'Postergado';
  
  if (task.wasEnProgreso && !dueDateModifiedToday) return 'Revisar';
  
  if (task.statusModifiedByUser) return 'En progreso';
  
  if (daysSinceCreation >= 1 && !task.statusModifiedByUser) return 'Empezar';
  
  if (createdToday && !task.statusModifiedByUser) return 'Nuevo';
  
  // Fallback
  return 'Nuevo';
}

/**
 * Get status color classes for UI display
 */
export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'Limite':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
    case 'Postergado':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700';
    case 'Revisar':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
    case 'En progreso':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    case 'Empezar':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    case 'Nuevo':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    case 'Listo':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
}

/**
 * Get status priority for sorting (lower number = higher priority)
 */
export function getTaskStatusPriority(status: TaskStatus): number {
  switch (status) {
    case 'Limite': return 1;
    case 'Postergado': return 2;
    case 'Revisar': return 3;
    case 'En progreso': return 4;
    case 'Empezar': return 5;
    case 'Nuevo': return 6;
    case 'Listo': return 7;
    default: return 8;
  }
}

/**
 * Map API status to legacy status for backward compatibility
 */
export function mapAPIStatusToLegacy(apiStatus: APITaskStatus): string {
  switch (apiStatus) {
    case 'TODO': return 'Nuevo';
    case 'IN_PROGRESS': return 'En progreso';
    case 'REVIEW': return 'Revisar';
    case 'DONE': return 'Listo';
    default: return 'Nuevo';
  }
}

/**
 * Map legacy status to API status
 */
export function mapLegacyStatusToAPI(legacyStatus: string): APITaskStatus {
  switch (legacyStatus) {
    case 'Nuevo': return 'TODO';
    case 'En progreso': return 'IN_PROGRESS';
    case 'Revisar': return 'REVIEW';
    case 'Listo': return 'DONE';
    // Keep English mappings for backward compatibility
    case 'New': return 'TODO';
    case 'In Progress': return 'IN_PROGRESS';
    case 'Review': return 'REVIEW';
    case 'Completed': return 'DONE';
    default: return 'TODO';
  }
}
