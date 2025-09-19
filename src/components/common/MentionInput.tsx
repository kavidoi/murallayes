import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Package, FolderOpen, Users, Building, Tag } from 'lucide-react';
import { AuthService } from '../../services/authService';

interface MentionSuggestion {
  id: string;
  type: 'User' | 'Product' | 'Project' | 'Task' | 'Contact' | 'Budget';
  name: string;
  subtitle?: string;
  avatar?: string;
  sku?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onMentionCreated?: (mention: { entityType: string; entityId: string; text: string }) => void;
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

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = 'Type @ to mention entities...',
  disabled = false,
  className = '',
  onMentionCreated,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search for entities when @ is typed
  const searchEntities = async (query: string): Promise<MentionSuggestion[]> => {
    if (!query || query.length < 1) return [];

    setLoading(true);
    try {
      // Search across multiple entity types
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
      
      // Sort by relevance and limit total results
      return flattened
        .sort((a, b) => {
          // Prioritize exact matches
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

  // Handle input changes and detect @ mentions
  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Detect @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpaceAfterAt = textAfterAt.includes(' ');
      
      if (!hasSpaceAfterAt && textAfterAt.length <= 50) {
        // We're in a mention
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
    onChange(newValue);
    setShowSuggestions(false);

    // Notify parent of mention creation
    if (onMentionCreated) {
      onMentionCreated({
        entityType: suggestion.type,
        entityId: suggestion.id,
        text: mentionText,
      });
    }

    // Focus back to input and position cursor
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
  );
};

export default MentionInput;