import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { websocketService } from '../services/websocket.service';
import type { User } from '../types';

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

      // Define handlers so we can unsubscribe on cleanup
      const presenceHandler = (data: UserPresence) => {
        setUserPresences(prev => {
          const newMap = new Map(prev);
          newMap.set(data.user.id, data);
          return newMap;
        });
      };

      const editingHandler = (data: EditingStatus) => {
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
      };

      const notificationHandler = (notification: any) => {
        setNotifications(prev => [notification, ...prev]);
      };

      const conflictHandler = (conflictEvent: ConflictEvent) => {
        if (user && conflictEvent.conflictingUser.id !== user.id) {
          setConflictEvents(prev => [conflictEvent, ...prev]);
        }
      };

      const dataChangeHandler = (changeEvent: any) => {
        console.log('Data change received:', changeEvent);
      };

      // Register all listeners via service so they survive reconnects
      websocketService.on('user-presence-update', presenceHandler);
      websocketService.on('editing-status-update', editingHandler);
      websocketService.on('notification', notificationHandler);
      websocketService.on('conflict-detected', conflictHandler);
      websocketService.on('data-change', dataChangeHandler);

      // Check connection status periodically
      const connectionInterval = setInterval(() => {
        setIsConnected(websocketService.isConnected());
      }, 1000);

      return () => {
        clearInterval(connectionInterval);
        // Unbind listeners to avoid duplicates on re-mount
        websocketService.off('user-presence-update', presenceHandler);
        websocketService.off('editing-status-update', editingHandler);
        websocketService.off('notification', notificationHandler);
        websocketService.off('conflict-detected', conflictHandler);
        websocketService.off('data-change', dataChangeHandler);
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