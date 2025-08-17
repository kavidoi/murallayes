import axios from 'axios';
import { HttpsUtils } from '../utils/https';
import { AuthService } from './authService';

const API_BASE_URL = HttpsUtils.getApiBaseUrl();

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

class UsersService {
  private getAuthHeaders() {
    return AuthService.getAuthHeaders() as Record<string, string>;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/users/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      const users = await this.getAllUsers();
      return users.filter(user => user.isActive);
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
export default usersService;
