import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface UseEditingStatusProps {
  resource: string;
  resourceId: string;
  autoStart?: boolean;
}

export const useEditingStatus = ({ 
  resource, 
  resourceId, 
  autoStart = false 
}: UseEditingStatusProps) => {
  const { broadcastEditingStatus, isUserEditing, getEditingUsers } = useWebSocket();
  const [isEditing, setIsEditing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start editing
  const startEditing = () => {
    if (!isEditing) {
      setIsEditing(true);
      broadcastEditingStatus(resource, resourceId, true);
    }
  };

  // Stop editing
  const stopEditing = () => {
    if (isEditing) {
      setIsEditing(false);
      broadcastEditingStatus(resource, resourceId, false);
    }
  };

  // Auto-stop editing after inactivity
  const refreshEditingStatus = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isEditing) {
      // Re-broadcast that we're still editing
      broadcastEditingStatus(resource, resourceId, true);
      
      // Set timeout to auto-stop editing after 30 seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        stopEditing();
      }, 30000);
    }
  };

  // Get other users editing this resource
  const otherUsersEditing = getEditingUsers(resource, resourceId, true);
  const isOthersEditing = isUserEditing(resource, resourceId, true);

  // Auto-start editing if enabled
  useEffect(() => {
    if (autoStart) {
      startEditing();
    }

    return () => {
      if (isEditing) {
        stopEditing();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resource, resourceId, autoStart]);

  // Refresh editing status on activity
  useEffect(() => {
    refreshEditingStatus();
  }, [isEditing]);

  return {
    isEditing,
    startEditing,
    stopEditing,
    refreshEditingStatus,
    otherUsersEditing,
    isOthersEditing,
  };
};