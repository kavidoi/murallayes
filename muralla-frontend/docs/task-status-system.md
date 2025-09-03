# Intelligent Task Status System

## Overview
The new task status system replaces static status labels with intelligent, context-aware status calculation based on task lifecycle and user interactions.

## Status Types

| Status | Priority | Condition | Description |
|--------|----------|-----------|-------------|
| **Limite** | 1 | Due today (not created today) | Highest priority - deadline is today |
| **Postergado** | 2 | Was "En progreso" + deadline modified today | Task deadline was pushed |
| **Revisar** | 3 | Was "En progreso" + deadline not modified today | Needs review/attention |
| **En progreso** | 4 | User manually set status | Actively being worked on |
| **Empezar** | 5 | >1 day old + not manually started | Ready to begin work |
| **Nuevo** | 6 | Created today + not started | Fresh task |
| **Listo** | 7 | Task completed | Final state |

## Data Requirements

### New Fields
```typescript
interface TaskWithIntelligentStatus {
  // Existing fields
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string;
  
  // New tracking fields
  createdAt: string;
  dueDateModifiedAt?: string;
  statusModifiedByUser: boolean;
  wasEnProgreso: boolean;
}
```

## Implementation

### 1. Status Calculation
```typescript
import { calculateTaskStatus } from '../types/task-status';

const intelligentStatus = calculateTaskStatus(task);
```

### 2. Using the Hook
```typescript
import { useTaskStatus } from '../hooks/useTaskStatus';

const { intelligentStatus, statusColor, statusPriority } = useTaskStatus(task);
```

### 3. Status Display
```typescript
<span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
  {intelligentStatus}
</span>
```

### 4. Handling Status Changes
```typescript
import { useTaskStatusActions } from '../hooks/useTaskStatus';

const { handleStatusChange, handleDueDateChange } = useTaskStatusActions();

// When user clicks "En progreso"
const updates = handleStatusChange(task, 'En progreso');

// When due date is modified
const updates = handleDueDateChange(task, newDueDate);
```

## Status Colors

- **Limite**: Red (urgent)
- **Postergado**: Orange (warning)
- **Revisar**: Yellow (attention)
- **En progreso**: Blue (active)
- **Empezar**: Purple (ready)
- **Nuevo**: Gray (neutral)
- **Listo**: Green (success)

## Migration Strategy

1. ✅ Create type definitions and calculation logic
2. ✅ Create utility hooks for components
3. 🔄 Update task display components
4. ⏳ Add backend API support for new fields
5. ⏳ Migrate existing tasks with default values
6. ⏳ Update task creation/editing workflows

## Usage Examples

### Display Task Status
```typescript
function TaskCard({ task }: { task: TaskWithIntelligentStatus }) {
  const { intelligentStatus, statusColor } = useTaskStatus(task);
  
  return (
    <div className="task-card">
      <span className={statusColor}>{intelligentStatus}</span>
      <h3>{task.title}</h3>
    </div>
  );
}
```

### Handle Status Updates
```typescript
function TaskActions({ task }: { task: TaskWithIntelligentStatus }) {
  const { handleStatusChange } = useTaskStatusActions();
  
  const markInProgress = () => {
    const updates = handleStatusChange(task, 'En progreso');
    // Send updates to API
    updateTask(task.id, updates);
  };
  
  return (
    <button onClick={markInProgress}>
      Marcar En Progreso
    </button>
  );
}
```
