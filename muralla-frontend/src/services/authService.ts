import { HttpsUtils } from '../utils/https';

// Advanced auth service with automatic token refresh
export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly API_BASE_URL = HttpsUtils.getApiBaseUrl();
  private static refreshPromise: Promise<void> | null = null;

  static getToken(): string {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  }

  static getRefreshToken(): string {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || '';
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return token
      ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  static isTokenExpired(token: string): boolean {
    if (!token) return true;
    try {
      const [, payloadSeg] = token.split('.');
      if (!payloadSeg) return true;

      // Convert base64url -> base64 and pad
      const base64 = payloadSeg.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(padded);
      const payload = JSON.parse(json);

      if (!payload?.exp || typeof payload.exp !== 'number') return true;

      const currentTime = Math.floor(Date.now() / 1000);
      // Consider token expiring within next 5 minutes as expired
      return payload.exp < currentTime + 300;
    } catch {
      // If we cannot safely decode, assume expired to be safe
      return true;
    }
  }

  static async refreshTokens(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token);
  }

  static async ensureValidToken(): Promise<void> {
    const token = this.getToken();
    
    if (!token || this.isTokenExpired(token)) {
      // If already refreshing, wait for that to complete
      if (this.refreshPromise) {
        await this.refreshPromise;
        return;
      }

      // Start refresh process
      this.refreshPromise = this.refreshTokens();
      try {
        await this.refreshPromise;
      } finally {
        this.refreshPromise = null;
      }
    }
  }

  static async login(identifier: string, password: string): Promise<void> {
    console.log('AuthService.login called with:', { identifier, hasPassword: !!password });
    console.log('API_BASE_URL:', this.API_BASE_URL);
    
    const res = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password }),
    });
    
    console.log('Login response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Login failed response:', errorText);
      throw new Error(`Login failed: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Login response data:', { hasAccessToken: !!data?.access_token, hasRefreshToken: !!data?.refresh_token });
    
    if (data?.access_token && data?.refresh_token) {
      this.setTokens(data.access_token, data.refresh_token);
      console.log('Tokens set successfully');
    } else {
      throw new Error('Invalid response: missing tokens');
    }
  }

  static logout(): void {
    this.clearTokens();
    // Optional: call backend logout endpoint
  }

  static async apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure we have a valid token before making the call
    await this.ensureValidToken();

    const url = `${this.API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    } as HeadersInit;

    const response = await fetch(url, { ...options, headers });

    // If we get 401, try refreshing once more
    if (response.status === 401) {
      try {
        await this.refreshTokens();
        // Retry with new token
        const retryHeaders = {
          ...this.getAuthHeaders(),
          ...options.headers,
        } as HeadersInit;
        
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
        
        if (!retryResponse.ok) {
          if (retryResponse.status === 401) {
            this.clearTokens();
            window.location.href = '/login';
          }
          throw new Error(`API call failed: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        return (await retryResponse.json()) as T;
      } catch (refreshError) {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  // Multipart/form-data upload helper (do not set Content-Type so browser sets boundary)
  static async upload<T = any>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    await this.ensureValidToken();
    const url = `${this.API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as T;
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    if (this.isTokenExpired(token)) {
      try {
        await this.refreshTokens();
      } catch {
        return false;
      }
    }

    try {
      const res = await fetch(`${this.API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static debugToken(): void {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!token) { 
      console.log('No access token present'); 
      return; 
    }
    
    console.log('Current token:', token.substring(0, 50) + '...');
    console.log('Refresh token:', refreshToken ? refreshToken.substring(0, 50) + '...' : 'None');
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token expires at:', new Date(payload.exp * 1000));
      console.log('Token expired:', this.isTokenExpired(token));
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  }

  // Initialize demo token only in dev when explicitly enabled
  static init(): void {
    const enableDemo = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO === 'true';
    if (enableDemo) {
      // For demo mode, just set a long-lived token
      const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWRyYWo3ZGg4MDAwMXN1dHFvdDk3aWdxIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDIzMzk1MywiZXhwIjoxNzg1NzY5OTUzfQ.6kvsSWL7iN-pkjNuohpyKmHU7aP2WqvBIu8_jxeePQI';
      this.setTokens(demoToken, demoToken);
      console.log('AuthService initialized with demo token (dev only)');
    }
  }
}

// Initialize auth service (dev only if enabled)
AuthService.init();
