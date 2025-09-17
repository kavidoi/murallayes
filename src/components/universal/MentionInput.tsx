import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface EntityMention {
  id: string;
  type: 'user' | 'product' | 'project' | 'task' | 'contact' | 'budget' | 'supplier';
  name: string;
  displayName: string;
  metadata?: any;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: EntityMention[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onMentionSelect?: (mention: EntityMention) => void;
}

const ENTITY_TYPES = [
  { type: 'user', emoji: '👤', label: 'Usuarios' },
  { type: 'product', emoji: '📦', label: 'Productos' },
  { type: 'project', emoji: '📂', label: 'Proyectos' },
  { type: 'task', emoji: '✅', label: 'Tareas' },
  { type: 'contact', emoji: '👥', label: 'Contactos' },
  { type: 'budget', emoji: '💰', label: 'Presupuestos' },
  { type: 'supplier', emoji: '🏢', label: 'Proveedores' }
] as const;

// Mock data for demonstration - in real implementation, this would come from API
const MOCK_ENTITIES: EntityMention[] = [
  // Users
  { id: 'u1', type: 'user', name: 'Juan Pérez', displayName: '@Juan-Perez' },
  { id: 'u2', type: 'user', name: 'María García', displayName: '@Maria-Garcia' },
  { id: 'u3', type: 'user', name: 'Carlos López', displayName: '@Carlos-Lopez' },
  
  // Products
  { id: 'p1', type: 'product', name: 'Café Colombiano Premium', displayName: '@Product-Cafe-Colombiano' },
  { id: 'p2', type: 'product', name: 'Té Verde Orgánico', displayName: '@Product-Te-Verde' },
  { id: 'p3', type: 'product', name: 'Azúcar Morena', displayName: '@Product-Azucar-Morena' },
  
  // Projects
  { id: 'pr1', type: 'project', name: 'Lanzamiento Q4 2024', displayName: '@Project-Q4-Launch' },
  { id: 'pr2', type: 'project', name: 'Renovación Oficina', displayName: '@Project-Office-Renovation' },
  
  // Suppliers
  { id: 's1', type: 'supplier', name: 'Distribuidora Central', displayName: '@Supplier-Distribuidora-Central' },
  { id: 's2', type: 'supplier', name: 'Café del Valle', displayName: '@Supplier-Cafe-Valle' },
  { id: 's3', type: 'supplier', name: 'Equipos de Oficina SA', displayName: '@Supplier-Equipos-Oficina' }
];

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = 'Escribe @ para mencionar entidades...',
  className = '',
  disabled = false,
  onMentionSelect
}) => {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<EntityMention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [currentMention, setCurrentMention] = useState('');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Extract existing mentions from text
  const extractMentions = (text: string): EntityMention[] => {
    const mentionRegex = /@[\w-]+/g;
    const matches = text.match(mentionRegex) || [];
    
    return matches.map(match => {
      const entity = MOCK_ENTITIES.find(e => e.displayName === match);
      return entity || {
        id: match,
        type: 'user',
        name: match,
        displayName: match
      } as EntityMention;
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    // Check if user is typing a mention
    const beforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@[\w-]*$/);
    
    if (mentionMatch) {
      const start = cursorPos - mentionMatch[0].length;
      const mentionText = mentionMatch[0].slice(1); // Remove @
      
      setMentionStart(start);
      setCurrentMention(mentionText);
      
      // Filter suggestions based on mention text
      const filtered = MOCK_ENTITIES.filter(entity => 
        entity.name.toLowerCase().includes(mentionText.toLowerCase()) ||
        entity.displayName.toLowerCase().includes(mentionText.toLowerCase())
      );
      
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setMentionStart(-1);
      setCurrentMention('');
    }

    // Extract mentions and call onChange
    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  // Handle mention selection
  const selectMention = (mention: EntityMention) => {
    if (!inputRef.current || mentionStart === -1) return;

    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + currentMention.length + 1); // +1 for @
    const newValue = before + mention.displayName + after;
    
    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
    
    // Call mention selection callback
    onMentionSelect?.(mention);
    
    setShowSuggestions(false);
    setMentionStart(-1);
    setCurrentMention('');
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = before.length + mention.displayName.length;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
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
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none ${className}`}
        rows={3}
      />
      
      {/* Mention Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => {
            const entityType = ENTITY_TYPES.find(t => t.type === suggestion.type);
            return (
              <div
                key={suggestion.id}
                onClick={() => selectMention(suggestion)}
                className={`px-3 py-2 cursor-pointer flex items-center space-x-2 ${
                  index === selectedIndex 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{entityType?.emoji || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.displayName} • {entityType?.label || suggestion.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Escribe @ para mencionar usuarios, productos, proyectos y más
      </div>
    </div>
  );
};

export default MentionInput;