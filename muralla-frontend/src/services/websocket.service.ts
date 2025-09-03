import { io, Socket } from 'socket.io-client';
import type { User } from '../types';

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
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

class WebSocketServiceImpl implements WebSocketService {
  socket: Socket | null = null;
  private currentUser: User | null = null;
  private currentToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  private isConnecting = false;
  // Buffer listeners until socket exists; also re-bind on reconnection
  private pendingListeners: Array<{ event: string; callback: (data: any) => void }> = [];

  connect(token: string, user: User) {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.currentUser = user;
    this.currentToken = token;
    this.isConnecting = true;
    
    this.connectWithBackoff(token);
  }

  private async connectWithBackoff(token: string) {
    try {
      await this.establishConnection(token);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(
          this.baseDelay * Math.pow(2, this.reconnectAttempts),
          this.maxDelay
        );
        const jitter = Math.random() * 1000; // Add 0-1s randomness
        const totalDelay = delay + jitter;

        console.log(`WebSocket connection failed. Retrying in ${Math.round(totalDelay)}ms... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connectWithBackoff(token);
        }, totalDelay);
      } else {
        console.error('WebSocket: Max reconnection attempts reached. Connection failed permanently.');
      }
    }
  }

  private establishConnection(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000';
      console.log('WebSocket: Attempting to connect to:', wsUrl);
      this.socket = io(wsUrl, {
        auth: {
          token: token,
        },
        // Allow polling fallback for environments where native WS is blocked (proxies/CDNs)
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        autoConnect: false, // Manual connection control
        reconnection: false, // Handle reconnection manually
        timeout: 10000, // Slightly longer timeout for slower cold starts
        withCredentials: true,
      });

      // Bind any listeners registered before socket creation
      this.bindPendingListeners();

      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        // Send user presence information after successful connection
        this.socket?.emit('user-presence', {
          user: this.currentUser,
          status: 'online',
          timestamp: new Date().toISOString(),
        });
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        this.socket?.disconnect();
        reject(error);
      });

      // Attempt connection
      this.socket.connect();
      
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      // Attempt reconnection for transport-related reasons
      if (
        reason === 'io server disconnect' ||
        reason === 'transport close' ||
        reason === 'transport error' ||
        reason === 'ping timeout'
      ) {
        // Server initiated disconnect or transport issues - attempt reconnection
        setTimeout(() => {
          if (this.currentUser && this.currentToken) {
            this.reconnectAttempts = 0; // Reset for new connection cycle
            this.connectWithBackoff(this.currentToken);
          }
        }, 1000);
      }
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
      this.socket.emit('join-room', { room });
      console.log('Joined room:', room);
    }
  }

  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', { room });
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
    this.on('user-presence-update', callback);
  }

  onEditingStatus(callback: (data: any) => void) {
    this.on('editing-status-update', callback);
  }

  onNotification(callback: (data: any) => void) {
    this.on('notification', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (data: any) => void) {
    // Remove from live socket
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
    // Remove from pending buffer if present
    if (callback) {
      this.pendingListeners = this.pendingListeners.filter(
        (l) => !(l.event === event && l.callback === callback)
      );
    } else {
      this.pendingListeners = this.pendingListeners.filter((l) => l.event !== event);
    }
  }

  // Generic event registration that survives reconnects
  on(event: string, callback: (data: any) => void) {
    // If socket exists, bind immediately
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
    // Always store for future bindings (new socket instances)
    this.pendingListeners.push({ event, callback });
  }

  private bindPendingListeners() {
    if (!this.socket) return;
    for (const { event, callback } of this.pendingListeners) {
      this.socket.on(event, callback as any);
    }
  }
}

// Export singleton instance
export const websocketService: WebSocketService = new WebSocketServiceImpl();