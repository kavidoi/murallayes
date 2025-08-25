import { io, Socket } from 'socket.io-client';
import { User } from './authService';

export interface WebSocketService {
  socket: Socket | null;
  connect: (token: string, user: User) => void;
  disconnect: () => void;
  isConnected: () => boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  broadcastEditingStatus: (resource: string, resourceId: string, isEditing: boolean) => void;
  onUserPresence: (callback: (data: any) => void) => void;
  onEditingStatus: (callback: (data: any) => void) => void;
  onNotification: (callback: (data: any) => void) => void;
}

class WebSocketServiceImpl implements WebSocketService {
  socket: Socket | null = null;
  private currentUser: User | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string, user: User) {
    if (this.socket?.connected) {
      return;
    }

    this.currentUser = user;
    
    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: {
        token: token,
      },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send user presence information
      this.socket?.emit('user-presence', {
        user: this.currentUser,
        status: 'online',
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });
  }

  disconnect() {
    if (this.socket) {
      // Send offline status before disconnecting
      this.socket.emit('user-presence', {
        user: this.currentUser,
        status: 'offline',
        timestamp: new Date().toISOString(),
      });
      
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUser = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-room', room);
      console.log('Joined room:', room);
    }
  }

  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', room);
      console.log('Left room:', room);
    }
  }

  broadcastEditingStatus(resource: string, resourceId: string, isEditing: boolean) {
    if (this.socket?.connected && this.currentUser) {
      this.socket.emit('editing-status', {
        user: this.currentUser,
        resource,
        resourceId,
        isEditing,
        timestamp: new Date().toISOString(),
      });
    }
  }

  onUserPresence(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-presence-update', callback);
    }
  }

  onEditingStatus(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('editing-status-update', callback);
    }
  }

  onNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // Remove event listeners
  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Export singleton instance
export const websocketService: WebSocketService = new WebSocketServiceImpl();