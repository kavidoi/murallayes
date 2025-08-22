import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignees: User[];
  labels: Label[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  estimatedHours: number;
  actualHours?: number;
  project: string;
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
}

interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: User;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Comment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
}

interface Column {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  limit?: number;
}

const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  const columns: Column[] = [
    { id: 'backlog', title: 'Backlog', status: 'backlog', color: 'bg-gray-100 dark:bg-gray-800', limit: undefined },
    { id: 'todo', title: 'To Do', status: 'todo', color: 'bg-electric-blue/10 dark:bg-electric-blue/5', limit: 8 },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress', color: 'bg-electric-yellow/10 dark:bg-electric-yellow/5', limit: 5 },
    { id: 'review', title: 'Review', status: 'review', color: 'bg-electric-purple/10 dark:bg-electric-purple/5', limit: 3 },
    { id: 'done', title: 'Done', status: 'done', color: 'bg-electric-green/10 dark:bg-electric-green/5', limit: undefined }
  ];

  const users: User[] = [
    { id: '1', name: 'Juan Pérez', avatar: 'JP', email: 'juan@muralla.com' },
    { id: '2', name: 'María González', avatar: 'MG', email: 'maria@muralla.com' },
    { id: '3', name: 'Carlos Rodríguez', avatar: 'CR', email: 'carlos@muralla.com' },
    { id: '4', name: 'Ana López', avatar: 'AL', email: 'ana@muralla.com' }
  ];

  const projects = ['Proyecto Alpha', 'Proyecto Beta', 'Proyecto Gamma', 'Infraestructura'];

  const labels: Label[] = [
    { id: '1', name: 'Frontend', color: 'bg-electric-blue/20 text-electric-blue' },
    { id: '2', name: 'Backend', color: 'bg-electric-green/20 text-electric-green' },
    { id: '3', name: 'Bug', color: 'bg-electric-red/20 text-electric-red' },
    { id: '4', name: 'Feature', color: 'bg-electric-purple/20 text-electric-purple' },
    { id: '5', name: 'Documentation', color: 'bg-electric-yellow/20 text-electric-yellow' }
  ];

  useEffect(() => {
    // Initialize with sample data
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'Diseñar nueva landing page',
        description: 'Crear wireframes y mockups para la nueva página principal',
        status: 'todo',
        priority: 'high',
        assignees: [users[0], users[1]],
        labels: [labels[0], labels[3]],
        dueDate: '2024-03-20',
        createdAt: '2024-03-01',
        updatedAt: '2024-03-10',
        estimatedHours: 16,
        project: 'Proyecto Alpha',
        subtasks: [
          { id: '1', title: 'Wireframes móvil', completed: true, assignee: users[0] },
          { id: '2', title: 'Wireframes desktop', completed: false, assignee: users[1] },
          { id: '3', title: 'Prototipo interactivo', completed: false }
        ],
        attachments: [],
        comments: []
      },
      {
        id: '2',
        title: 'Implementar autenticación OAuth',
        description: 'Integrar login con Google y GitHub',
        status: 'in-progress',
        priority: 'medium',
        assignees: [users[2]],
        labels: [labels[1], labels[3]],
        dueDate: '2024-03-25',
        createdAt: '2024-03-05',
        updatedAt: '2024-03-12',
        estimatedHours: 12,
        actualHours: 8,
        project: 'Proyecto Alpha',
        subtasks: [
          { id: '1', title: 'Setup OAuth providers', completed: true, assignee: users[2] },
          { id: '2', title: 'Implementar callbacks', completed: true, assignee: users[2] },
          { id: '3', title: 'Testing y validación', completed: false, assignee: users[2] }
        ],
        attachments: [],
        comments: [
          {
            id: '1',
            text: 'Google OAuth ya funcionando, trabajando en GitHub',
            author: users[2],
            createdAt: '2024-03-12'
          }
        ]
      },
      {
        id: '3',
        title: 'Corregir bug en checkout',
        description: 'El proceso de pago se cuelga en dispositivos móviles',
        status: 'review',
        priority: 'urgent',
        assignees: [users[3]],
        labels: [labels[2], labels[0]],
        dueDate: '2024-03-15',
        createdAt: '2024-03-08',
        updatedAt: '2024-03-13',
        estimatedHours: 4,
        actualHours: 6,
        project: 'Proyecto Beta',
        subtasks: [
          { id: '1', title: 'Reproducir bug', completed: true, assignee: users[3] },
          { id: '2', title: 'Identificar causa', completed: true, assignee: users[3] },
          { id: '3', title: 'Implementar fix', completed: true, assignee: users[3] },
          { id: '4', title: 'Testing en dispositivos', completed: false, assignee: users[3] }
        ],
        attachments: [],
        comments: []
      },
      {
        id: '4',
        title: 'Documentar APIs v2',
        description: 'Actualizar documentación técnica para la nueva versión',
        status: 'done',
        priority: 'low',
        assignees: [users[1]],
        labels: [labels[4]],
        createdAt: '2024-02-15',
        updatedAt: '2024-03-01',
        estimatedHours: 8,
        actualHours: 10,
        project: 'Infraestructura',
        subtasks: [
          { id: '1', title: 'Swagger documentation', completed: true, assignee: users[1] },
          { id: '2', title: 'Ejemplos de código', completed: true, assignee: users[1] },
          { id: '3', title: 'Guías de migración', completed: true, assignee: users[1] }
        ],
        attachments: [],
        comments: []
      }
    ];
    setTasks(sampleTasks);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-electric-red text-white';
      case 'high': return 'bg-electric-red/20 text-electric-red';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'low': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔥';
      case 'high': return '⬆️';
      case 'medium': return '➡️';
      case 'low': return '⬇️';
      default: return '';
    }
  };

  const getTasksForColumn = (status: Task['status']) => {
    return tasks.filter(task => {
      const statusMatch = task.status === status;
      const projectMatch = filterProject === 'all' || task.project === filterProject;
      const assigneeMatch = filterAssignee === 'all' || task.assignees.some(a => a.id === filterAssignee);
      return statusMatch && projectMatch && assigneeMatch;
    });
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTask) {
      setTasks(tasks.map(task => 
        task.id === draggedTask.id 
          ? { ...task, status, updatedAt: new Date().toISOString() }
          : task
      ));
      setDraggedTask(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Vencido hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Vence mañana';
    return `Vence en ${diffDays} días`;
  };

  const getCompletedSubtasks = (subtasks: Subtask[]) => {
    return subtasks.filter(st => st.completed).length;
  };

  const calculateProgress = (subtasks: Subtask[]) => {
    if (subtasks.length === 0) return 0;
    return (getCompletedSubtasks(subtasks) / subtasks.length) * 100;
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Calculate metrics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t => t.dueDate && isOverdue(t.dueDate)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 Tablero Kanban</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión visual de tareas y flujo de trabajo
          </p>
        </div>
        <button 
          onClick={() => setShowTaskModal(true)}
          className="btn-electric"
        >
          ➕ Nueva Tarea
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tareas"
          value={totalTasks}
          subtitle={`${doneTasks} completadas`}
          color="electric-blue"
        />
        <StatCard
          title="En Progreso"
          value={inProgressTasks}
          subtitle="tareas activas"
          color="electric-yellow"
        />
        <StatCard
          title="Completadas"
          value={doneTasks}
          subtitle={`${Math.round((doneTasks / totalTasks) * 100)}% del total`}
          color="electric-green"
        />
        <StatCard
          title="Vencidas"
          value={overdueTasks}
          subtitle="requieren atención"
          color="electric-red"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proyecto
              </label>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="input"
              >
                <option value="all">Todos los proyectos</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asignado a
              </label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="input"
              >
                <option value="all">Todos los usuarios</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-6" style={{ minWidth: '1200px' }}>
          {columns.map((column) => {
            const columnTasks = getTasksForColumn(column.status);
            const isOverLimit = column.limit && columnTasks.length > column.limit;
            
            return (
              <div
                key={column.id}
                className={`flex-1 min-w-80 rounded-lg ${column.color} p-4`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      isOverLimit 
                        ? 'bg-electric-red/20 text-electric-red' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {columnTasks.length}
                      {column.limit && ` / ${column.limit}`}
                    </span>
                  </div>
                  {isOverLimit && (
                    <span className="text-electric-red text-sm">⚠️</span>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                        </span>
                      </div>

                      {/* Labels */}
                      {task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.labels.map((label) => (
                            <span
                              key={label.id}
                              className={`px-2 py-1 text-xs rounded ${label.color}`}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progress */}
                      {task.subtasks.length > 0 && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Subtareas</span>
                            <span>{getCompletedSubtasks(task.subtasks)} / {task.subtasks.length}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                            <div
                              className="bg-electric-blue h-1.5 rounded-full"
                              style={{ width: `${calculateProgress(task.subtasks)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div className={`text-xs mb-2 ${
                          isOverdue(task.dueDate) 
                            ? 'text-electric-red' 
                            : 'text-gray-500'
                        }`}>
                          📅 {formatDate(task.dueDate)}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {/* Assignees */}
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((assignee) => (
                            <div
                              key={assignee.id}
                              className="w-6 h-6 rounded-full bg-electric-blue text-white flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800"
                              title={assignee.name}
                            >
                              {assignee.avatar}
                            </div>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center text-xs text-gray-500">
                          {task.comments.length > 0 && (
                            <span className="mr-2">💬 {task.comments.length}</span>
                          )}
                          {task.attachments.length > 0 && (
                            <span>📎 {task.attachments.length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Task Button */}
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="w-full mt-3 p-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  ➕ Agregar tarea
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {selectedTask ? (
              /* Task Details View */
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedTask.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <select className="input">
                      <option value={selectedTask.status}>{selectedTask.status}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioridad
                    </label>
                    <select className="input">
                      <option value={selectedTask.priority}>{selectedTask.priority}</option>
                    </select>
                  </div>
                </div>

                {/* Subtasks */}
                {selectedTask.subtasks.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Subtareas ({getCompletedSubtasks(selectedTask.subtasks)} / {selectedTask.subtasks.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <input 
                            type="checkbox" 
                            checked={subtask.completed}
                            className="mr-3 text-electric-blue rounded"
                            readOnly
                          />
                          <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {subtask.title}
                          </span>
                          {subtask.assignee && (
                            <span className="text-xs text-gray-500">{subtask.assignee.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedTask.comments.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Comentarios
                    </h5>
                    <div className="space-y-3">
                      {selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center text-sm font-medium mr-3">
                            {comment.author.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">{comment.author.name}</span>
                              <span className="ml-2 text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="btn-electric flex-1">
                    Guardar Cambios
                  </button>
                  <button 
                    onClick={() => {
                      setShowTaskModal(false);
                      setSelectedTask(null);
                    }}
                    className="btn-outline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* New Task Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título *
                  </label>
                  <input type="text" className="input" placeholder="Título de la tarea" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea className="input h-20 resize-none" placeholder="Describe la tarea..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Proyecto
                    </label>
                    <select className="input">
                      {projects.map(project => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioridad
                    </label>
                    <select className="input">
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha límite
                    </label>
                    <input type="date" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Horas estimadas
                    </label>
                    <input type="number" className="input" placeholder="8" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn-electric flex-1">
                    Crear Tarea
                  </button>
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;