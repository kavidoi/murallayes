import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LinkIcon, PlusIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

export interface EntityRelationship {
  id: string;
  sourceEntityId: string;
  sourceEntityType: string;
  targetEntityId: string;
  targetEntityType: string;
  relationshipType: string;
  strength: number;
  context?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityReference {
  id: string;
  type: string;
  name: string;
  displayName?: string;
}

interface RelationshipManagerProps {
  entityId: string;
  entityType: string;
  entityName: string;
  className?: string;
  onRelationshipCreate?: (relationship: EntityRelationship) => void;
  onRelationshipDelete?: (relationshipId: string) => void;
}

const RELATIONSHIP_TYPES = [
  { type: 'assigned_to', label: 'Asignado a', bidirectional: true },
  { type: 'supplies', label: 'Suministra', reverse: 'supplied_by' },
  { type: 'belongs_to', label: 'Pertenece a', reverse: 'contains' },
  { type: 'depends_on', label: 'Depende de', reverse: 'dependency_for' },
  { type: 'collaborates_with', label: 'Colabora con', bidirectional: true },
  { type: 'mentioned_in', label: 'Mencionado en', reverse: 'mentions' },
  { type: 'related_to', label: 'Relacionado con', bidirectional: true }
] as const;

const ENTITY_ICONS = {
  user: '👤',
  product: '📦',
  project: '📂',
  task: '✅',
  contact: '👥',
  budget: '💰',
  supplier: '🏢',
  expense: '💸',
  default: '📄'
};

// Mock data for demonstration
const MOCK_RELATIONSHIPS: EntityRelationship[] = [
  {
    id: 'rel1',
    sourceEntityId: 'expense1',
    sourceEntityType: 'expense',
    targetEntityId: 's1',
    targetEntityType: 'supplier',
    relationshipType: 'supplied_by',
    strength: 8,
    context: 'Factura de suministros de oficina',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'rel2',
    sourceEntityId: 'expense1',
    sourceEntityType: 'expense',
    targetEntityId: 'p1',
    targetEntityType: 'product',
    relationshipType: 'mentions',
    strength: 6,
    context: 'Mencionado en descripción del gasto',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_ENTITIES: EntityReference[] = [
  { id: 'u1', type: 'user', name: 'Juan Pérez', displayName: '@Juan-Perez' },
  { id: 'u2', type: 'user', name: 'María García', displayName: '@Maria-Garcia' },
  { id: 'p1', type: 'product', name: 'Café Colombiano Premium' },
  { id: 'p2', type: 'product', name: 'Té Verde Orgánico' },
  { id: 'pr1', type: 'project', name: 'Lanzamiento Q4 2024' },
  { id: 's1', type: 'supplier', name: 'Distribuidora Central' },
  { id: 's2', type: 'supplier', name: 'Café del Valle' }
];

export const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  entityId,
  entityType,
  entityName,
  className = '',
  onRelationshipCreate,
  onRelationshipDelete
}) => {
  const { t } = useTranslation();
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityReference | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState('related_to');
  const [relationshipContext, setRelationshipContext] = useState('');
  const [loading, setLoading] = useState(true);

  // Load relationships for this entity
  useEffect(() => {
    loadRelationships();
  }, [entityId, entityType]);

  const loadRelationships = async () => {
    setLoading(true);
    try {
      // In real implementation, fetch from API
      const entityRelationships = MOCK_RELATIONSHIPS.filter(
        rel => rel.sourceEntityId === entityId || rel.targetEntityId === entityId
      );
      setRelationships(entityRelationships);
    } catch (error) {
      console.error('Error loading relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRelationship = async () => {
    if (!selectedEntity) return;

    const newRelationship: EntityRelationship = {
      id: `rel_${Date.now()}`,
      sourceEntityId: entityId,
      sourceEntityType: entityType,
      targetEntityId: selectedEntity.id,
      targetEntityType: selectedEntity.type,
      relationshipType: selectedRelationType,
      strength: 5, // Default strength
      context: relationshipContext || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // In real implementation, save to API
      setRelationships(prev => [...prev, newRelationship]);
      onRelationshipCreate?.(newRelationship);
      
      // Reset form
      setSelectedEntity(null);
      setSelectedRelationType('related_to');
      setRelationshipContext('');
      setShowAddForm(false);
      
      console.log('✅ Relationship created:', newRelationship);
    } catch (error) {
      console.error('❌ Error creating relationship:', error);
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    try {
      setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
      onRelationshipDelete?.(relationshipId);
      console.log('✅ Relationship deleted:', relationshipId);
    } catch (error) {
      console.error('❌ Error deleting relationship:', error);
    }
  };

  const getEntityDetails = (entityId: string, entityType: string): EntityReference | null => {
    return MOCK_ENTITIES.find(e => e.id === entityId && e.type === entityType) || null;
  };

  const getRelationshipLabel = (relationship: EntityRelationship, isSource: boolean): string => {
    const relType = RELATIONSHIP_TYPES.find(rt => rt.type === relationship.relationshipType);
    if (!relType) return relationship.relationshipType;
    
    if (isSource) {
      return relType.label;
    } else {
      return relType.bidirectional ? relType.label : (relType.reverse || relType.label);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Relaciones
            </h3>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
              {relationships.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar
          </button>
        </div>
      </div>

      <div className="p-4">
        {relationships.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay relaciones definidas</p>
            <p className="text-sm">Agrega relaciones para conectar esta entidad con otras</p>
          </div>
        ) : (
          <div className="space-y-3">
            {relationships.map(relationship => {
              const isSource = relationship.sourceEntityId === entityId;
              const targetEntity = getEntityDetails(
                isSource ? relationship.targetEntityId : relationship.sourceEntityId,
                isSource ? relationship.targetEntityType : relationship.sourceEntityType
              );
              const relationLabel = getRelationshipLabel(relationship, isSource);
              const entityIcon = ENTITY_ICONS[targetEntity?.type as keyof typeof ENTITY_ICONS] || ENTITY_ICONS.default;

              return (
                <div
                  key={relationship.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-lg">{entityIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {targetEntity?.name || 'Entidad desconocida'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {relationLabel}
                        </span>
                      </div>
                      {relationship.context && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {relationship.context}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full" 
                              style={{ width: `${relationship.strength * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {relationship.strength}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {/* TODO: Open entity details */}}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRelationship(relationship.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Relationship Form */}
        {showAddForm && (
          <div className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Nueva Relación
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Entidad
                </label>
                <select
                  value={selectedEntity?.id || ''}
                  onChange={(e) => {
                    const entity = MOCK_ENTITIES.find(ent => ent.id === e.target.value);
                    setSelectedEntity(entity || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Seleccionar entidad...</option>
                  {MOCK_ENTITIES.map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {ENTITY_ICONS[entity.type as keyof typeof ENTITY_ICONS]} {entity.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Relación
                </label>
                <select
                  value={selectedRelationType}
                  onChange={(e) => setSelectedRelationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  {RELATIONSHIP_TYPES.map(relType => (
                    <option key={relType.type} value={relType.type}>
                      {relType.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contexto (Opcional)
                </label>
                <input
                  type="text"
                  value={relationshipContext}
                  onChange={(e) => setRelationshipContext(e.target.value)}
                  placeholder="Describe el contexto de la relación..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={createRelationship}
                  disabled={!selectedEntity}
                  className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Relación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipManager;