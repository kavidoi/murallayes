import { useMemo } from 'react';
import type { TaskWithIntelligentStatus, TaskStatus } from '../types/task-status';
import { calculateTaskStatus, getTaskStatusColor, getTaskStatusPriority } from '../types/task-status';

/**
 * Hook to calculate and manage intelligent task status
 */
export function useTaskStatus(task: TaskWithIntelligentStatus) {
  const intelligentStatus = useMemo(() => {
    return calculateTaskStatus(task);
  }, [
    task.status,
    task.dueDate,
    task.createdAt,
    task.dueDateModifiedAt,
    task.statusModifiedByUser,
    task.wasEnProgreso
  ]);

  const statusColor = useMemo(() => {
    return getTaskStatusColor(intelligentStatus);
  }, [intelligentStatus]);

  const statusPriority = useMemo(() => {
    return getTaskStatusPriority(intelligentStatus);
  }, [intelligentStatus]);

  return {
    intelligentStatus,
    statusColor,
    statusPriority
  };
}

/**
 * Hook to handle status changes with proper tracking
 */
export function useTaskStatusActions() {
  const handleStatusChange = (
    task: TaskWithIntelligentStatus,
    newStatus: 'En progreso' | 'Listo'
  ): Partial<TaskWithIntelligentStatus> => {
    const updates: Partial<TaskWithIntelligentStatus> = {};

    if (newStatus === 'En progreso') {
      updates.statusModifiedByUser = true;
      updates.wasEnProgreso = true;
    } else if (newStatus === 'Listo') {
      updates.status = 'DONE';
    }

    return updates;
  };

  const handleDueDateChange = (
    task: TaskWithIntelligentStatus,
    newDueDate: string
  ): Partial<TaskWithIntelligentStatus> => {
    const today = new Date().toISOString();
    
    return {
      dueDate: newDueDate,
      dueDateModifiedAt: today
    };
  };

  return {
    handleStatusChange,
    handleDueDateChange
  };
}
