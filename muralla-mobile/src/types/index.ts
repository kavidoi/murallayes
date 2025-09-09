export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  kind?: 'DEADLINE' | 'CORE';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  project?: Project;
  assigneeId?: string;
  assignee?: User;
  assignees?: TaskAssignee[];
  dueDate?: string;
  parentTaskId?: string;
  subtasks?: Task[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  role: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface MobileTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  projectName?: string;
  assignees: User[];
  dueDate?: string | null; // DD/MM/YYYY format
  subtasks: MobileTask[];
  expanded?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
