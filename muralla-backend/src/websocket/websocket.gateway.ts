import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

interface UserPresence {
  user: any;
  status: 'online' | 'offline' | 'away';
  timestamp: string;
  currentResource?: string;
}

interface EditingStatus {
  user: any;
  resource: string;
  resourceId: string;
  isEditing: boolean;
  timestamp: string;
}

interface DataChange {
  resource: string;
  resourceId: string;
  data: any;
  version?: string;
  user: any;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userPresences = new Map<string, UserPresence>();
  private editingStatuses = new Map<string, EditingStatus[]>();
  private resourceVersions = new Map<string, string>(); // Track resource versions for conflict detection

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      client.join(`user:${user.id}`);
      console.log(`User ${user.username} connected via WebSocket`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      const userId = client.data.user.id;
      console.log(`User ${client.data.user.username} disconnected from WebSocket`);
      
      // Remove user presence
      this.userPresences.delete(userId);
      
      // Remove all editing statuses for this user
      for (const [key, statuses] of this.editingStatuses.entries()) {
        const updatedStatuses = statuses.filter(status => status.user.id !== userId);
        if (updatedStatuses.length === 0) {
          this.editingStatuses.delete(key);
        } else {
          this.editingStatuses.set(key, updatedStatuses);
        }
      }
      
      // Broadcast user offline status
      this.server.emit('user-presence-update', {
        user: client.data.user,
        status: 'offline',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    client.emit('joined-room', { room: data.room });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    client.emit('left-room', { room: data.room });
  }

  @SubscribeMessage('user-presence')
  handleUserPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UserPresence,
  ) {
    if (client.data.user) {
      const userId = client.data.user.id;
      const presence: UserPresence = {
        user: client.data.user,
        status: data.status,
        timestamp: data.timestamp,
        currentResource: data.currentResource,
      };
      
      this.userPresences.set(userId, presence);
      
      // Broadcast to all connected clients
      this.server.emit('user-presence-update', presence);
    }
  }

  @SubscribeMessage('editing-status')
  handleEditingStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: EditingStatus,
  ) {
    if (client.data.user) {
      const key = `${data.resource}:${data.resourceId}`;
      const editingStatus: EditingStatus = {
        user: client.data.user,
        resource: data.resource,
        resourceId: data.resourceId,
        isEditing: data.isEditing,
        timestamp: data.timestamp,
      };
      
      // Get current statuses for this resource
      const currentStatuses = this.editingStatuses.get(key) || [];
      
      // Remove any existing status for this user
      const updatedStatuses = currentStatuses.filter(
        status => status.user.id !== client.data.user.id
      );
      
      // Add new status if user is editing
      if (data.isEditing) {
        updatedStatuses.push(editingStatus);
      }
      
      // Update the map
      if (updatedStatuses.length > 0) {
        this.editingStatuses.set(key, updatedStatuses);
      } else {
        this.editingStatuses.delete(key);
      }
      
      // Broadcast to all connected clients
      this.server.emit('editing-status-update', editingStatus);
    }
  }

  @SubscribeMessage('data-change')
  handleDataChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DataChange,
  ) {
    if (client.data.user) {
      const resourceKey = `${data.resource}:${data.resourceId}`;
      const currentVersion = this.resourceVersions.get(resourceKey);
      
      // Check for version conflicts
      if (data.version && currentVersion && data.version !== currentVersion) {
        // Potential conflict detected
        const editingUsers = this.editingStatuses.get(resourceKey) || [];
        const conflictingUsers = editingUsers
          .filter(status => status.user.id !== client.data.user.id && status.isEditing)
          .map(status => status.user);

        if (conflictingUsers.length > 0) {
          // Broadcast conflict to the conflicting users
          conflictingUsers.forEach(user => {
            this.server.to(`user:${user.id}`).emit('conflict-detected', {
              resourceType: data.resource,
              resourceId: data.resourceId,
              conflictingUser: client.data.user,
              conflictData: data,
              timestamp: new Date().toISOString(),
            });
          });

          // Also inform the current user about the conflict
          client.emit('conflict-detected', {
            resourceType: data.resource,
            resourceId: data.resourceId,
            conflictingUser: conflictingUsers[0], // Primary conflicting user
            conflictData: {
              resource: data.resource,
              resourceId: data.resourceId,
              user: conflictingUsers[0],
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          });
          
          return; // Don't broadcast the change if there's a conflict
        }
      }

      // Update version and broadcast change
      const newVersion = this.generateVersion();
      this.resourceVersions.set(resourceKey, newVersion);
      
      const changeEvent = {
        ...data,
        version: newVersion,
        user: client.data.user,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all other connected clients
      client.broadcast.emit('data-change', changeEvent);
    }
  }

  private generateVersion(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Broadcast methods for real-time updates
  broadcastTaskUpdate(task: any) {
    this.server.emit('task-updated', task);
  }

  broadcastDocumentUpdate(document: any) {
    this.server.emit('document-updated', document);
  }

  broadcastSaleCreated(sale: any) {
    this.server.emit('sale-created', sale);
  }

  broadcastTransactionCreated(transaction: any) {
    this.server.emit('transaction-created', transaction);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
