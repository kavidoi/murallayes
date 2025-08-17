import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    description: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  project: Project;
  assigneeId?: string;
  assignee?: User;
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
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
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

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
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
}

export const tasksService = new TasksService();
export default tasksService;
