import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Link2, Trash2, Edit, Eye, MoreVertical } from 'lucide-react';
import { EntityRelationship, RelationshipType } from '../../types/relationship';
import { AuthService } from '../../services/authService';

interface RelationshipManagerProps {
  entityType?: string;
  entityId?: string;
  showCreateButton?: boolean;
  compact?: boolean;
  onRelationshipCreated?: (relationship: EntityRelationship) => void;
  onRelationshipUpdated?: (relationship: EntityRelationship) => void;
  onRelationshipDeleted?: (relationshipId: string) => void;
}

export const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  entityType,
  entityId,
  showCreateButton = true,
  compact = false,
  onRelationshipCreated,
  onRelationshipUpdated,
  onRelationshipDeleted,
}) => {
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<EntityRelationship | null>(null);

  // Load relationships and types
  useEffect(() => {
    loadRelationships();
    loadRelationshipTypes();
  }, [entityType, entityId, searchTerm, selectedType]);

  const loadRelationships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityType) params.append('sourceType', entityType);
      if (entityId) params.append('sourceId', entityId);
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('relationshipType', selectedType);

      const response = await fetch(`/entity-relationships?${params}`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRelationships(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelationshipTypes = async () => {
    try {
      const response = await fetch('/entity-relationships/types', {
        headers: AuthService.getAuthHeaders(),
      });
      if (response.ok) {
        const types = await response.json();
        setRelationshipTypes(types);
      }
    } catch (error) {
      console.error('Failed to load relationship types:', error);
    }
  };

  const handleCreateRelationship = () => {
    setEditingRelationship(null);
    setShowCreateModal(true);
  };

  const handleEditRelationship = (relationship: EntityRelationship) => {
    setEditingRelationship(relationship);
    setShowCreateModal(true);
  };

  const handleDeleteRelationship = async (relationship: EntityRelationship) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;

    try {
      const response = await fetch(`/entity-relationships/${relationship.id}`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      if (response.ok) {
        setRelationships(prev => prev.filter(r => r.id !== relationship.id));
        onRelationshipDeleted?.(relationship.id);
      }
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    }
  };

  const renderRelationshipCard = (relationship: EntityRelationship) => {
    const relationshipType = relationshipTypes.find(t => t.name === relationship.relationshipType);
    const isSource = relationship.sourceType === entityType && relationship.sourceId === entityId;
    const displayEntity = isSource 
      ? { type: relationship.targetType, id: relationship.targetId }
      : { type: relationship.sourceType, id: relationship.sourceId };

    return (
      <div
        key={relationship.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Link2 
                size={16} 
                className="text-gray-400" 
                style={{ color: relationshipType?.color }}
              />
              <span className="font-medium text-gray-900">
                {relationshipType?.displayName || relationship.relationshipType}
              </span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < (relationship.strength || 1) ? 'bg-yellow-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">{displayEntity.type}</span>
              {relationship.metadata?.entityName && (
                <span className="ml-1">: {relationship.metadata.entityName}</span>
              )}
            </div>

            {relationship.metadata && Object.keys(relationship.metadata).length > 0 && (
              <div className="text-xs text-gray-500">
                {relationship.metadata.description && (
                  <p className="mb-1">{relationship.metadata.description}</p>
                )}
                {relationship.lastInteractionAt && (
                  <p>
                    Last interaction: {new Date(relationship.lastInteractionAt).toLocaleDateString()}
                  </p>
                )}
                {relationship.interactionCount > 0 && (
                  <p>Interactions: {relationship.interactionCount}</p>
                )}
              </div>
            )}

            {relationship.tags && relationship.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {relationship.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => handleEditRelationship(relationship)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit relationship"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteRelationship(relationship)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete relationship"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredRelationships = relationships.filter(rel => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        rel.relationshipType.toLowerCase().includes(searchLower) ||
        rel.sourceType.toLowerCase().includes(searchLower) ||
        rel.targetType.toLowerCase().includes(searchLower) ||
        rel.metadata?.entityName?.toLowerCase().includes(searchLower) ||
        rel.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">
            Relationships ({relationships.length})
          </h4>
          {showCreateButton && (
            <button
              onClick={handleCreateRelationship}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredRelationships.slice(0, 5).map(renderRelationshipCard)}
          {relationships.length > 5 && (
            <div className="text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {relationships.length} relationships
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Entity Relationships
          </h2>
          <p className="text-gray-600 mt-1">
            Manage connections between entities in your system
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={handleCreateRelationship}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Relationship
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search relationships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All relationship types</option>
              {relationshipTypes.map(type => (
                <option key={type.id} value={type.name}>
                  {type.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Relationships List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading relationships...</span>
          </div>
        ) : filteredRelationships.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredRelationships.map(renderRelationshipCard)}
          </div>
        ) : (
          <div className="text-center py-8">
            <Link2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No relationships found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first relationship.'}
            </p>
            {showCreateButton && !searchTerm && !selectedType && (
              <button
                onClick={handleCreateRelationship}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Relationship
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <RelationshipCreateModal
          relationship={editingRelationship}
          relationshipTypes={relationshipTypes}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRelationship(null);
          }}
          onSave={(relationship) => {
            if (editingRelationship) {
              setRelationships(prev => prev.map(r => 
                r.id === relationship.id ? relationship : r
              ));
              onRelationshipUpdated?.(relationship);
            } else {
              setRelationships(prev => [relationship, ...prev]);
              onRelationshipCreated?.(relationship);
            }
            setShowCreateModal(false);
            setEditingRelationship(null);
          }}
        />
      )}
    </div>
  );
};

// Placeholder for the create modal component
const RelationshipCreateModal: React.FC<any> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Create Relationship</h3>
        <p className="text-gray-600 mb-4">Relationship creation modal coming soon...</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default RelationshipManager;