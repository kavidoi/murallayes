import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface PresenceIndicatorProps {
  className?: string;
  showOnlineCount?: boolean;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  className = '',
  showOnlineCount = true,
}) => {
  const { getOnlineUsers, isConnected } = useWebSocket();
  const onlineUsers = getOnlineUsers();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection status */}
      <div className="flex items-center space-x-1">
        <div 
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {/* Online users count */}
      {showOnlineCount && onlineUsers.length > 0 && (
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-600">
            {onlineUsers.length} en línea
          </span>
        </div>
      )}

      {/* Online users avatars */}
      {onlineUsers.length > 0 && (
        <div className="flex -space-x-1">
          {onlineUsers.slice(0, 5).map((user, _index) => (
            <div
              key={user.id}
              className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border border-white"
              title={user.name || user.email}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          ))}
          
          {onlineUsers.length > 5 && (
            <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border border-white">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
};