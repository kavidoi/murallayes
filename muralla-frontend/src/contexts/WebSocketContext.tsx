import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketService } from '../services/websocket.service';
import { User } from '../services/authService';

export interface UserPresence {
  user: User;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  currentResource?: string;
}

export interface EditingStatus {
  user: User;
  resource: string;
  resourceId: string;
  isEditing: boolean;
  timestamp: string;
}

export interface ConflictEvent {
  resourceType: string;
  resourceId: string;
  conflictingUser: User;
  conflictData: any;
  timestamp: string;
}

export interface WebSocketContextType {
  isConnected: boolean;
  userPresences: Map<string, UserPresence>;
  editingStatuses: Map<string, EditingStatus[]>;
  notifications: any[];
  conflictEvents: ConflictEvent[];
  
  // Actions
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  broadcastEditingStatus: (resource: string, resourceId: string, isEditing: boolean) => void;
  broadcastDataChange: (resource: string, resourceId: string, data: any, version?: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearConflicts: () => void;
  
  // Utilities
  isUserEditing: (resource: string, resourceId: string, excludeCurrentUser?: boolean) => boolean;
  getEditingUsers: (resource: string, resourceId: string, excludeCurrentUser?: boolean) => User[];
  getOnlineUsers: () => User[];
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  user: User | null;
  token: string | null;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  user,
  token,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userPresences, setUserPresences] = useState<Map<string, UserPresence>>(new Map());
  const [editingStatuses, setEditingStatuses] = useState<Map<string, EditingStatus[]>>(new Map());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [conflictEvents, setConflictEvents] = useState<ConflictEvent[]>([]);

  useEffect(() => {
    if (user && token) {
      websocketService.connect(token, user);

      // Set up event listeners
      websocketService.onUserPresence((data: UserPresence) => {
        setUserPresences(prev => {
          const newMap = new Map(prev);
          newMap.set(data.user.id, data);
          return newMap;
        });
      });

      websocketService.onEditingStatus((data: EditingStatus) => {
        const key = `${data.resource}:${data.resourceId}`;
        
        setEditingStatuses(prev => {
          const newMap = new Map(prev);
          const currentStatuses = newMap.get(key) || [];
          
          // Remove any existing status for this user
          const filteredStatuses = currentStatuses.filter(
            status => status.user.id !== data.user.id
          );
          
          // Add new status if user is editing, otherwise just remove old status
          if (data.isEditing) {
            filteredStatuses.push(data);
          }
          
          if (filteredStatuses.length > 0) {
            newMap.set(key, filteredStatuses);
          } else {
            newMap.delete(key);
          }
          
          return newMap;
        });
      });

      websocketService.onNotification((notification: any) => {
        setNotifications(prev => [notification, ...prev]);
      });

      // Set up conflict event listener
      websocketService.socket?.on('conflict-detected', (conflictEvent: ConflictEvent) => {
        setConflictEvents(prev => [conflictEvent, ...prev]);
      });

      websocketService.socket?.on('data-change', (changeEvent: any) => {
        // Handle incoming data changes that might conflict with local edits
        console.log('Data change received:', changeEvent);
      });

      // Check connection status periodically
      const connectionInterval = setInterval(() => {
        setIsConnected(websocketService.isConnected());
      }, 1000);

      return () => {
        clearInterval(connectionInterval);
        websocketService.disconnect();
      };
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user, token]);

  const joinRoom = (room: string) => {
    websocketService.joinRoom(room);
  };

  const leaveRoom = (room: string) => {
    websocketService.leaveRoom(room);
  };

  const broadcastEditingStatus = (resource: string, resourceId: string, isEditing: boolean) => {
    websocketService.broadcastEditingStatus(resource, resourceId, isEditing);
  };

  const broadcastDataChange = (resource: string, resourceId: string, data: any, version?: string) => {
    if (websocketService.socket?.connected) {
      websocketService.socket.emit('data-change', {
        resource,
        resourceId,
        data,
        version,
        user: user,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearConflicts = () => {
    setConflictEvents([]);
  };

  const isUserEditing = (
    resource: string,
    resourceId: string,
    excludeCurrentUser: boolean = true
  ): boolean => {
    const key = `${resource}:${resourceId}`;
    const statuses = editingStatuses.get(key) || [];
    
    return statuses.some(status => {
      if (excludeCurrentUser && user && status.user.id === user.id) {
        return false;
      }
      return status.isEditing;
    });
  };

  const getEditingUsers = (
    resource: string,
    resourceId: string,
    excludeCurrentUser: boolean = true
  ): User[] => {
    const key = `${resource}:${resourceId}`;
    const statuses = editingStatuses.get(key) || [];
    
    return statuses
      .filter(status => {
        if (excludeCurrentUser && user && status.user.id === user.id) {
          return false;
        }
        return status.isEditing;
      })
      .map(status => status.user);
  };

  const getOnlineUsers = (): User[] => {
    return Array.from(userPresences.values())
      .filter(presence => presence.status === 'online')
      .map(presence => presence.user);
  };

  const contextValue: WebSocketContextType = {
    isConnected,
    userPresences,
    editingStatuses,
    notifications,
    conflictEvents,
    joinRoom,
    leaveRoom,
    broadcastEditingStatus,
    broadcastDataChange,
    clearNotifications,
    markNotificationAsRead,
    clearConflicts,
    isUserEditing,
    getEditingUsers,
    getOnlineUsers,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};