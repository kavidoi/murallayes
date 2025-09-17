import { useState, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface ConflictField {
  field: string;
  label: string;
  currentValue: any;
  incomingValue: any;
}

interface ConflictData {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  conflictingUser: {
    id: string;
    name: string;
    email: string;
  };
  conflicts: ConflictField[];
  timestamp: string;
}

interface UseConflictResolutionProps {
  onConflictResolved?: (resolvedData: any) => void;
  onConflictIgnored?: () => void;
}

export const useConflictResolution = ({
  onConflictResolved,
  onConflictIgnored
}: UseConflictResolutionProps = {}) => {
  const { broadcastEditingStatus } = useWebSocket();
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Detect conflicts by comparing two data objects
  const detectConflicts = useCallback((
    originalData: Record<string, any>,
    currentData: Record<string, any>,
    incomingData: Record<string, any>,
    fieldLabels: Record<string, string> = {}
  ): ConflictField[] => {
    const conflicts: ConflictField[] = [];
    
    // Get all keys that exist in either current or incoming data
    const allKeys = new Set([
      ...Object.keys(currentData),
      ...Object.keys(incomingData)
    ]);

    allKeys.forEach(key => {
      const originalValue = originalData[key];
      const currentValue = currentData[key];
      const incomingValue = incomingData[key];

      // Skip if both current and incoming are the same as original
      if (
        isEqual(currentValue, originalValue) && 
        isEqual(incomingValue, originalValue)
      ) {
        return;
      }

      // Skip if current and incoming values are the same
      if (isEqual(currentValue, incomingValue)) {
        return;
      }

      // We have a conflict if both current and incoming differ from original
      // and they differ from each other
      if (
        (!isEqual(currentValue, originalValue) || !isEqual(incomingValue, originalValue)) &&
        !isEqual(currentValue, incomingValue)
      ) {
        conflicts.push({
          field: key,
          label: fieldLabels[key] || formatFieldName(key),
          currentValue,
          incomingValue
        });
      }
    });

    return conflicts;
  }, []);

  // Show conflict resolution modal
  const showConflictResolution = useCallback((conflictData: ConflictData) => {
    setCurrentConflict(conflictData);
    setIsConflictModalOpen(true);
  }, []);

  // Handle conflict resolution
  const handleConflictResolve = useCallback((resolvedFields: Record<string, any>) => {
    if (currentConflict && onConflictResolved) {
      // Merge resolved fields with original data
      const resolvedData = {
        ...currentConflict,
        resolvedFields,
        resolvedAt: new Date().toISOString()
      };
      
      onConflictResolved(resolvedData);
      
      // Stop editing status
      broadcastEditingStatus(
        currentConflict.resourceType,
        currentConflict.resourceId,
        false
      );
    }
    
    setCurrentConflict(null);
    setIsConflictModalOpen(false);
  }, [currentConflict, onConflictResolved, broadcastEditingStatus]);

  // Handle conflict modal close
  const handleConflictClose = useCallback(() => {
    if (onConflictIgnored) {
      onConflictIgnored();
    }
    
    setCurrentConflict(null);
    setIsConflictModalOpen(false);
  }, [onConflictIgnored]);

  // Check for conflicts before saving
  const checkForConflicts = useCallback(async (
    resourceType: string,
    resourceId: string,
    originalData: Record<string, any>,
    currentData: Record<string, any>,
    fieldLabels?: Record<string, string>
  ): Promise<boolean> => {
    try {
      // Simulate fetching latest data from server
      // In a real implementation, this would be an API call
      const latestData = await fetchLatestData(resourceType, resourceId);
      
      const conflicts = detectConflicts(
        originalData,
        currentData,
        latestData,
        fieldLabels
      );

      if (conflicts.length > 0) {
        // Get information about who made the conflicting changes
        const conflictingUser = await getLastModifiedBy(resourceType, resourceId);
        
        showConflictResolution({
          resourceType,
          resourceId,
          resourceName: latestData.name || `${resourceType} ${resourceId}`,
          conflictingUser,
          conflicts,
          timestamp: new Date().toISOString()
        });
        
        return true; // Has conflicts
      }

      return false; // No conflicts
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return false;
    }
  }, [detectConflicts, showConflictResolution]);

  return {
    // State
    currentConflict,
    isConflictModalOpen,
    
    // Methods
    detectConflicts,
    checkForConflicts,
    showConflictResolution,
    handleConflictResolve,
    handleConflictClose,
  };
};

// Helper functions
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, i) => isEqual(val, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && 
           keysA.every(key => isEqual(a[key], b[key]));
  }
  return false;
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Mock API functions - replace with actual API calls
async function fetchLatestData(resourceType: string, resourceId: string): Promise<Record<string, any>> {
  // This would be replaced with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: resourceId,
        name: 'Sample Product',
        price: 1500,
        description: 'Updated description from server',
        // ... other fields
      });
    }, 100);
  });
}

async function getLastModifiedBy(resourceType: string, resourceId: string): Promise<{ id: string; name: string; email: string }> {
  // This would be replaced with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'user-2',
        name: 'María González',
        email: 'maria@example.com'
      });
    }, 100);
  });
}