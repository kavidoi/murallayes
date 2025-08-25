import axios from 'axios';
import { HttpsUtils } from '../utils/https';
import { AuthService } from './authService';
import { User } from '../types/user';

const API_BASE_URL = HttpsUtils.getApiBaseUrl();

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: User;
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
  assignee?: User;
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
}

class TasksService {
  private getAuthHeaders() {
    return AuthService.getAuthHeaders() as Record<string, string>;
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      await AuthService.ensureValidToken();
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
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/tasks?projectId=${projectId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      throw error;
    }
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/tasks?assigneeId=${assigneeId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      throw error;
    }
  }

  async getTask(id: string): Promise<Task> {
    try {
      await AuthService.ensureValidToken();
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
      await AuthService.ensureValidToken();
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
      await AuthService.ensureValidToken();
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
      await AuthService.ensureValidToken();
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
      await AuthService.ensureValidToken();
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
      await AuthService.ensureValidToken();
      const response = await axios.patch(`${API_BASE_URL}/tasks/subtasks/${id}`, updates, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  }

  async reorderTasks(taskIds: string[]): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.patch(`${API_BASE_URL}/tasks/reorder`, { taskIds }, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error reordering tasks:', error);
      throw error;
    }
  }

  async reorderSubtasks(parentTaskId: string, subtaskIds: string[]): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.patch(`${API_BASE_URL}/tasks/${parentTaskId}/subtasks/reorder`, { subtaskIds }, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error reordering subtasks:', error);
      throw error;
    }
  }

  async addTaskAssignee(taskId: string, userId: string, role: string = 'assignee'): Promise<TaskAssignee> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/assignees`, { userId, role }, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error adding task assignee:', error);
      throw error;
    }
  }

  async removeTaskAssignee(taskId: string, userId: string): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/assignees/${userId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error removing task assignee:', error);
      throw error;
    }
  }

  async updateTaskAssignees(taskId: string, userIds: string[]): Promise<Task> {
    const maxRetries = 2;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await AuthService.ensureValidToken();
        const response = await axios.patch(`${API_BASE_URL}/tasks/${taskId}/assignees`, { userIds }, {
          headers: this.getAuthHeaders(),
        });
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Only retry on 500 errors, not on 4xx errors
        if (error.response?.status === 500 && attempt < maxRetries) {
          console.warn(`Retrying updateTaskAssignees (attempt ${attempt + 1}/${maxRetries + 1})`);
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        
        console.error('Error updating task assignees:', error);
        throw error;
      }
    }
    
    throw lastError;
  }

  async getMyTasks(): Promise<Task[]> {
    try {
      await AuthService.ensureValidToken();
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
