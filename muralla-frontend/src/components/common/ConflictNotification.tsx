import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from '../../contexts/WebSocketContext';

export const ConflictNotification: React.FC = () => {
  const { conflictEvents, clearConflicts } = useWebSocket();

  const handleViewConflict = (conflictId: string) => {
    // This would open the specific conflict resolution modal
    console.log('View conflict:', conflictId);
  };

  const handleDismissConflict = (conflictId: string) => {
    // Remove specific conflict
    console.log('Dismiss conflict:', conflictId);
  };

  if (conflictEvents.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {conflictEvents.slice(0, 3).map((conflict, _index) => (
          <motion.div
            key={`${conflict.resourceType}-${conflict.resourceId}-${conflict.timestamp}`}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-lg max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Conflicto de Edición
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {conflict.conflictingUser.name || conflict.conflictingUser.email} modificó{' '}
                  <span className="font-medium">
                    {conflict.resourceType === 'product' ? 'el producto' : conflict.resourceType}
                  </span>{' '}
                  que estás editando.
                </p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                  {new Date(conflict.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              <button
                onClick={() => handleDismissConflict(conflict.resourceId)}
                className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-3">
              <button
                onClick={() => handleViewConflict(conflict.resourceId)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
                <span>Ver Conflicto</span>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Clear all button */}
      {conflictEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <button
            onClick={clearConflicts}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            Limpiar todas ({conflictEvents.length})
          </button>
        </motion.div>
      )}
    </div>
  );
};