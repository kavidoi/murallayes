import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ConflictField {
  field: string;
  label: string;
  currentValue: any;
  incomingValue: any;
  resolvedValue?: any;
}

interface ConflictResolutionProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (resolvedFields: Record<string, any>) => void;
  resourceName: string;
  conflicts: ConflictField[];
  currentUser: string;
  conflictingUser: string;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionProps> = ({
  isOpen,
  onClose,
  onResolve,
  resourceName,
  conflicts,
  currentUser,
  conflictingUser,
}) => {
  const { t } = useTranslation();
  const [resolvedFields, setResolvedFields] = useState<Record<string, any>>({});
  const [resolutionStrategy, setResolutionStrategy] = useState<'manual' | 'mine' | 'theirs' | 'merge'>('manual');

  if (!isOpen) return null;

  const handleFieldResolution = (field: string, value: any) => {
    setResolvedFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStrategyChange = (strategy: typeof resolutionStrategy) => {
    setResolutionStrategy(strategy);
    
    const newResolved: Record<string, any> = {};
    conflicts.forEach(conflict => {
      switch (strategy) {
        case 'mine':
          newResolved[conflict.field] = conflict.currentValue;
          break;
        case 'theirs':
          newResolved[conflict.field] = conflict.incomingValue;
          break;
        case 'merge':
          // Simple merge strategy - for strings, concatenate; for numbers, take average
          if (typeof conflict.currentValue === 'string' && typeof conflict.incomingValue === 'string') {
            newResolved[conflict.field] = `${conflict.currentValue} ${conflict.incomingValue}`;
          } else if (typeof conflict.currentValue === 'number' && typeof conflict.incomingValue === 'number') {
            newResolved[conflict.field] = Math.round((conflict.currentValue + conflict.incomingValue) / 2);
          } else {
            newResolved[conflict.field] = conflict.incomingValue; // Default to theirs
          }
          break;
        default:
          // Manual - keep existing resolved values
          break;
      }
    });
    
    if (strategy !== 'manual') {
      setResolvedFields(newResolved);
    }
  };

  const handleResolve = () => {
    const finalResolved = { ...resolvedFields };
    
    // Ensure all conflicts are resolved
    conflicts.forEach(conflict => {
      if (!(conflict.field in finalResolved)) {
        finalResolved[conflict.field] = conflict.currentValue; // Default to current
      }
    });
    
    onResolve(finalResolved);
  };

  const allConflictsResolved = conflicts.every(conflict => 
    conflict.field in resolvedFields
  );

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Sin valor';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Conflicto de Edición Detectado
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {conflictingUser} también está editando "{resourceName}"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Resolution Strategy */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Estrategia de Resolución
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'manual', label: 'Manual', desc: 'Resolver campo por campo' },
                { id: 'mine', label: 'Mis Cambios', desc: 'Usar mis valores' },
                { id: 'theirs', label: 'Sus Cambios', desc: `Usar valores de ${conflictingUser}` },
                { id: 'merge', label: 'Combinar', desc: 'Intentar fusionar automáticamente' },
              ].map(strategy => (
                <button
                  key={strategy.id}
                  onClick={() => handleStrategyChange(strategy.id as any)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    resolutionStrategy === strategy.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {strategy.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {strategy.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conflicts List */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Campos en Conflicto ({conflicts.length})
            </h3>
            
            <div className="space-y-4">
              {conflicts.map(conflict => (
                <div
                  key={conflict.field}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {conflict.label}
                    </h4>
                    {resolvedFields[conflict.field] !== undefined && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <CheckIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">Resuelto</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Current Value */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tu Versión
                      </label>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatValue(conflict.currentValue)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleFieldResolution(conflict.field, conflict.currentValue)}
                        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Usar Esta Versión
                      </button>
                    </div>

                    {/* Incoming Value */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Versión de {conflictingUser}
                      </label>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatValue(conflict.incomingValue)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleFieldResolution(conflict.field, conflict.incomingValue)}
                        className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Usar Esta Versión
                      </button>
                    </div>

                    {/* Resolved Value */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Valor Resuelto
                      </label>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg min-h-[44px] flex items-center">
                        {resolvedFields[conflict.field] !== undefined ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatValue(resolvedFields[conflict.field])}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                            Pendiente de resolver
                          </div>
                        )}
                      </div>
                      {resolutionStrategy === 'manual' && (
                        <input
                          type="text"
                          placeholder="Valor personalizado..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          onChange={(e) => handleFieldResolution(conflict.field, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {allConflictsResolved 
                ? `Todos los ${conflicts.length} conflictos resueltos`
                : `${Object.keys(resolvedFields).length} de ${conflicts.length} conflictos resueltos`
              }
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolve}
                disabled={!allConflictsResolved}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  allConflictsResolved
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Aplicar Resolución</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};