import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://muralla-backend.onrender.com/api';

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  project: Project;
  assigneeId?: string;
  assignee?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  assignees?: TaskAssignee[];
  dueDate?: string;
  dueTime?: string;
  parentTaskId?: string;
  parentTask?: Task;
  subtasks?: Task[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: string;
  assigneeId?: string;
  dueDate?: string;
}

class TasksService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks?projectId=${projectId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      throw error;
    }
  }

  async getTask(id: string): Promise<Task> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  async createTask(task: CreateTaskDto): Promise<Task> {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks`, task, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: string, updates: UpdateTaskDto): Promise<Task> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/tasks/${id}`, updates, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async createSubtask(parentTaskId: string, subtask: CreateTaskDto): Promise<Task> {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks/${parentTaskId}/subtasks`, subtask, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  }

  async updateSubtask(id: string, updates: UpdateTaskDto): Promise<Task> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/tasks/subtasks/${id}`, updates, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  }

  async updateTaskAssignees(taskId: string, userIds: string[]): Promise<Task> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/tasks/${taskId}/assignees`, { userIds }, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating task assignees:', error);
      throw error;
    }
  }

  async getMyTasks(): Promise<Task[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/my-tasks`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      throw error;
    }
  }
}

export const tasksService = new TasksService();
export default tasksService;
