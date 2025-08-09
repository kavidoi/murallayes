// Simple auth service for demo purposes
export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // For demo purposes only (dev environments). Do NOT enable in production.
  private static readonly DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWRyYWo3ZGg4MDAwMXN1dHFvdDk3aWdxIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDIzMzk1MywiZXhwIjoxNzg1NzY5OTUzfQ.6kvsSWL7iN-pkjNuohpyKmHU7aP2WqvBIu8_jxeePQI';

  static getToken(): string {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return token
      ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  static async apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    } as HeadersInit;

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  static async refreshToken(): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    if (response.ok) {
      const data = await response.json();
      this.setToken(data.access_token);
    }
  }

  // Initialize demo token only in dev when explicitly enabled
  static init(): void {
    const enableDemo = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO === 'true';
    if (enableDemo) {
      this.setToken(this.DEMO_TOKEN);
      console.log('AuthService initialized with demo token (dev only)');
    }
  }

  static debugToken(): void {
    const token = this.getToken();
    if (!token) { console.log('No token present'); return; }
    console.log('Current token:', token.substring(0, 50) + '...');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token expires at:', new Date(payload.exp * 1000));
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  }
}

// Initialize auth service (dev only if enabled)
AuthService.init();
