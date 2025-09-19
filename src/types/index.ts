// Consolidated types to prevent import conflicts
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  initials?: string;
  color?: string;
}

export interface APIProject {
  id: string;
  name: string;
  description?: string;
  deadline?: string;
  isCore?: boolean;
}

export interface Subtask {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  projectId?: string;
  assigneeIds?: string[];
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  subtasks?: Subtask[];
  order?: number;
}