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

class UsersService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAllUsers(): Promise<User[]> {
    try {
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
