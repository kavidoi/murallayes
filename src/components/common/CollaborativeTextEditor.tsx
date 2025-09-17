import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, User, Package, FolderOpen, Users, Building, Tag } from 'lucide-react';
import { AuthService } from '../../services/authService';

interface TextSegment {
  text: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  color: string;
}

interface MentionSuggestion {
  id: string;
  type: 'User' | 'Product' | 'Project' | 'Task' | 'Contact' | 'Budget';
  name: string;
  subtitle?: string;
  avatar?: string;
  sku?: string;
}

interface CollaborativeTextEditorProps {
  value: string;
  onChange: (value: string, segments: TextSegment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onMentionCreated?: (mention: { entityType: string; entityId: string; text: string }) => void;
  currentUser: { id: string; name: string };
  segments?: TextSegment[];
  showAuthorship?: boolean;
}

const ENTITY_ICONS = {
  User: User,
  Product: Package,
  Project: FolderOpen,
  Task: Tag,
  Contact: Users,
  Budget: Building,
};

const ENTITY_COLORS = {
  User: 'text-blue-600 bg-blue-100',
  Product: 'text-green-600 bg-green-100',
  Project: 'text-purple-600 bg-purple-100',
  Task: 'text-orange-600 bg-orange-100',
  Contact: 'text-cyan-600 bg-cyan-100',
  Budget: 'text-red-600 bg-red-100',
};

// Generate consistent colors for users
const getUserColor = (userId: string): string => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-red-100 text-red-800 border-red-200',
    'bg-orange-100 text-orange-800 border-orange-200',
  ];
  
  // Handle undefined or null userId
  if (!userId || typeof userId !== 'string') {
    return colors[0]; // Return default color
  }
  
  // Generate consistent color based on userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
};

export const CollaborativeTextEditor: React.FC<CollaborativeTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type @ to mention entities...',
  disabled = false,
  className = '',
  onMentionCreated,
  currentUser,
  segments = [],
  showAuthorship = true,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [textSegments, setTextSegments] = useState<TextSegment[]>(segments);
  const [lastChangePosition, setLastChangePosition] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize segments if empty
  useEffect(() => {
    if (textSegments.length === 0 && value) {
      setTextSegments([{
        text: value,
        authorId: currentUser?.id || 'unknown',
        authorName: currentUser?.name || 'Unknown User',
        timestamp: new Date(),
        color: getUserColor(currentUser?.id || 'default'),
      }]);
    }
  }, [value, currentUser?.id, currentUser?.name, textSegments.length]);

  // Search for entities when @ is typed
  const searchEntities = async (query: string): Promise<MentionSuggestion[]> => {
    if (!query || query.length < 1) return [];

    setLoading(true);
    try {
      const entityTypes = ['User', 'Product', 'Project', 'Task', 'Contact', 'Budget'];
      const searches = entityTypes.map(async (type) => {
        const response = await fetch(`/search/entities?type=${type}&query=${encodeURIComponent(query)}&limit=5`, {
          headers: AuthService.getAuthHeaders(),
        });
        if (response.ok) {
          const results = await response.json();
          return results.map((item: any) => ({
            ...item,
            type,
          }));
        }
        return [];
      });

      const allResults = await Promise.all(searches);
      const flattened = allResults.flat();
      
      return flattened
        .sort((a, b) => {
          const aExact = a.name.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
          const bExact = b.name.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
          return aExact - bExact;
        })
        .slice(0, 20);
    } catch (error) {
      console.error('Failed to search entities:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update text segments when content changes
  const updateSegments = useCallback((newValue: string, cursorPos: number) => {
    if (!showAuthorship) {
      onChange(newValue, textSegments);
      return;
    }

    // Find which segment was modified
    let currentPos = 0;
    let targetSegmentIndex = -1;
    let positionInSegment = 0;
    
    for (let i = 0; i < textSegments.length; i++) {
      const segmentEnd = currentPos + textSegments[i].text.length;
      if (cursorPos <= segmentEnd) {
        targetSegmentIndex = i;
        positionInSegment = cursorPos - currentPos;
        break;
      }
      currentPos = segmentEnd;
    }

    if (targetSegmentIndex === -1) {
      // Adding at the end
      const newSegments = [...textSegments];
      const addedText = newValue.slice(currentPos);
      if (addedText) {
        newSegments.push({
          text: addedText,
          authorId: currentUser?.id || 'unknown',
          authorName: currentUser?.name || 'Unknown User',
          timestamp: new Date(),
          color: getUserColor(currentUser?.id || 'default'),
        });
      }
      setTextSegments(newSegments);
      onChange(newValue, newSegments);
      return;
    }

    const newSegments = [...textSegments];
    const targetSegment = newSegments[targetSegmentIndex];
    
    // Calculate what changed in this segment
    const segmentStart = textSegments.slice(0, targetSegmentIndex).reduce((sum, seg) => sum + seg.text.length, 0);
    const segmentEnd = segmentStart + targetSegment.text.length;
    const newSegmentText = newValue.slice(segmentStart, segmentStart + (newValue.length - value.length) + targetSegment.text.length);
    
    if (targetSegment.authorId === currentUser.id) {
      // Same author, update the segment
      newSegments[targetSegmentIndex] = {
        ...targetSegment,
        text: newSegmentText,
        timestamp: new Date(),
      };
    } else {
      // Different author, split the segment
      const beforeText = targetSegment.text.slice(0, positionInSegment);
      const afterText = targetSegment.text.slice(positionInSegment);
      const insertedText = newValue.slice(segmentStart + positionInSegment, segmentStart + positionInSegment + (newValue.length - value.length));
      
      const newSegmentsList: TextSegment[] = [];
      
      // Add before part if it exists
      if (beforeText) {
        newSegmentsList.push({
          ...targetSegment,
          text: beforeText,
        });
      }
      
      // Add new content by current user
      if (insertedText) {
        newSegmentsList.push({
          text: insertedText,
          authorId: currentUser?.id || 'unknown',
          authorName: currentUser?.name || 'Unknown User',
          timestamp: new Date(),
          color: getUserColor(currentUser?.id || 'default'),
        });
      }
      
      // Add after part if it exists
      if (afterText) {
        newSegmentsList.push({
          ...targetSegment,
          text: afterText,
        });
      }
      
      newSegments.splice(targetSegmentIndex, 1, ...newSegmentsList);
    }

    setTextSegments(newSegments);
    onChange(newValue, newSegments);
  }, [textSegments, currentUser.id, currentUser.name, onChange, showAuthorship, value]);

  // Handle input changes and detect @ mentions
  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    updateSegments(newValue, cursorPos);
    setLastChangePosition(cursorPos);

    // Detect @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpaceAfterAt = textAfterAt.includes(' ');
      
      if (!hasSpaceAfterAt && textAfterAt.length <= 50) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        
        if (textAfterAt.length > 0) {
          const results = await searchEntities(textAfterAt);
          setSuggestions(results);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setSuggestions([]);
          setShowSuggestions(true);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Insert selected mention
  const insertMention = (suggestion: MentionSuggestion) => {
    const beforeMention = value.substring(0, mentionPosition);
    const afterMention = value.substring(mentionPosition + mentionQuery.length + 1);
    const mentionText = `@${suggestion.name}`;
    
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    updateSegments(newValue, mentionPosition + mentionText.length + 1);
    setShowSuggestions(false);

    if (onMentionCreated) {
      onMentionCreated({
        entityType: suggestion.type,
        entityId: suggestion.id,
        text: mentionText,
      });
    }

    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionPosition + mentionText.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // Render entity suggestion
  const renderSuggestion = (suggestion: MentionSuggestion, index: number) => {
    const Icon = ENTITY_ICONS[suggestion.type];
    const colorClass = ENTITY_COLORS[suggestion.type];
    const isSelected = index === selectedIndex;

    return (
      <div
        key={`${suggestion.type}-${suggestion.id}`}
        className={`flex items-center space-x-3 px-4 py-2 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
        }`}
        onClick={() => insertMention(suggestion)}
      >
        <div className={`p-1.5 rounded-full ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 truncate">
              {suggestion.name}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {suggestion.type}
            </span>
          </div>
          {suggestion.subtitle && (
            <p className="text-sm text-gray-500 truncate">{suggestion.subtitle}</p>
          )}
          {suggestion.sku && (
            <p className="text-xs text-gray-400 font-mono">{suggestion.sku}</p>
          )}
        </div>
      </div>
    );
  };

  // Render authorship indicators
  const renderAuthorshipView = () => {
    if (!showAuthorship) return null;

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-md border">
        <div className="text-xs text-gray-600 mb-2">Authorship breakdown:</div>
        <div className="flex flex-wrap gap-1">
          {textSegments.map((segment, index) => (
            <span
              key={index}
              className={`inline-block px-2 py-1 text-xs rounded-md border ${segment.color}`}
              title={`${segment.authorName} - ${segment.timestamp.toLocaleString()}`}
            >
              {segment.authorName}: "{segment.text.slice(0, 20)}{segment.text.length > 20 ? '...' : ''}"
            </span>
          ))}
        </div>
        {textSegments.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Contributors: {Array.from(new Set(textSegments.map(s => s.authorName))).join(', ')}
          </div>
        )}
      </div>
    );
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 dark:text-white dark:bg-gray-700 ${className}`}
          rows={3}
        />

        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
          >
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Search className="animate-spin" size={16} />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <>
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                  Found {suggestions.length} entities
                </div>
                {suggestions.map((suggestion, index) =>
                  renderSuggestion(suggestion, index)
                )}
              </>
            ) : mentionQuery.length > 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No entities found for "{mentionQuery}"
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                Type to search for users, products, projects, and more...
              </div>
            )}
          </div>
        )}
      </div>

      {renderAuthorshipView()}
    </div>
  );
};

export default CollaborativeTextEditor;