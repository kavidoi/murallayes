// Type definitions for the Muralla frontend application

export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}