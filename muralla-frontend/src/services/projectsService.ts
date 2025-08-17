import axios from 'axios';
import { HttpsUtils } from '../utils/https';
import { AuthService } from './authService';

const API_BASE_URL = HttpsUtils.getApiBaseUrl();

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
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

  async getOrCreateDefaultProject(): Promise<Project> {
    try {
      const projects = await this.getAllProjects();
      
      // Return the first project if any exist
      if (projects.length > 0) {
        return projects[0];
      }
      
      // Create a default project if none exist
      return await this.createProject({
        name: 'Default Project',
        description: 'Default project for tasks'
      });
    } catch (error) {
      console.error('Error getting or creating default project:', error);
      throw error;
    }
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
