import axios from 'axios';
import { HttpsUtils } from '../utils/https';
import { AuthService } from './authService';

const API_BASE_URL = HttpsUtils.getApiBaseUrl();

export interface Project {
  id: string;
  name: string;
  description?: string;
  kind?: ProjectKind;
  deadline?: string; // ISO string
  createdAt: string;
  updatedAt: string;
  budgets?: Budget[];
  tasks?: ProjectTask[];
}

export type ProjectKind = 'DEADLINE' | 'CORE'

export interface Budget {
  id: string;
  name: string;
  totalPlanned: number | string;
  totalCommitted: number | string;
  totalActual: number | string;
  currency: string;
}

export interface ProjectTask {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  kind?: ProjectKind;
  deadline?: string; // ISO string when kind === 'DEADLINE'
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  kind?: ProjectKind;
  deadline?: string; // ISO string when kind === 'DEADLINE'
}

class ProjectsService {
  private getAuthHeaders() {
    return AuthService.getAuthHeaders() as Record<string, string>;
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProject(id: string): Promise<Project> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  async createProject(project: CreateProjectDto): Promise<Project> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/projects`, project, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: string, updates: UpdateProjectDto): Promise<Project> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.patch(`${API_BASE_URL}/projects/${id}`, updates, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.delete(`${API_BASE_URL}/projects/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async getOrCreateDefaultProject(): Promise<Project> {
    try {
      const projects = await this.getAllProjects();
      
      // Look for "Muralla Café" project specifically
      const murallaProject = projects.find(p => p.name === 'Muralla Café');
      if (murallaProject) {
        return murallaProject;
      }
      
      // Return the first project if any exist (fallback)
      if (projects.length > 0) {
        return projects[0];
      }
      
      // Create the "Muralla Café" project if none exist
      return await this.createProject({
        name: 'Muralla Café',
        description: 'Proyecto principal de Muralla Café'
      });
    } catch (error) {
      console.error('Error getting or creating default project:', error);
      throw error;
    }
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
