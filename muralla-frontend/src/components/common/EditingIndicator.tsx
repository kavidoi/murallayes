import React from 'react';
import { User } from '../../services/websocket.service';

interface EditingIndicatorProps {
  users: User[];
  className?: string;
  showNames?: boolean;
}

export const EditingIndicator: React.FC<EditingIndicatorProps> = ({
  users,
  className = '',
  showNames = true,
}) => {
  if (users.length === 0) return null;

  const colors = [
    'bg-red-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  const getMessage = () => {
    if (users.length === 1) {
      return showNames 
        ? `${users[0].name || users[0].email} está editando`
        : 'Alguien está editando';
    }
    
    if (users.length === 2) {
      return showNames
        ? `${users[0].name || users[0].email} y ${users[1].name || users[1].email} están editando`
        : 'Varias personas están editando';
    }
    
    return showNames
      ? `${users[0].name || users[0].email} y ${users.length - 1} más están editando`
      : `${users.length} personas están editando`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* User avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.id}
            className={`w-6 h-6 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-medium border-2 border-white relative`}
            title={user.name || user.email}
          >
            {(user.name || user.email).charAt(0).toUpperCase()}
            
            {/* Pulsing animation */}
            <div className={`absolute inset-0 rounded-full ${colors[index % colors.length]} animate-ping opacity-50`}></div>
          </div>
        ))}
        
        {users.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
            +{users.length - 3}
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600 font-medium">
          {getMessage()}
        </span>
      </div>
    </div>
  );
};