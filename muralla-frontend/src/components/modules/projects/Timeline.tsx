import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Target, Filter, Eye, Plus, Edit3, Trash2, AlertTriangle } from 'lucide-react';

interface TimelineTask {
  id: string;
  title: string;
  description?: string;
  project: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  duration: number; // in days
  progress: number; // 0-100
  assignees: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  dependencies: string[];
  milestones: Array<{
    id: string;
    title: string;
    date: string;
    completed: boolean;
  }>;
  resources: Array<{
    id: string;
    name: string;
    allocation: number; // percentage
  }>;
  estimatedHours: number;
  actualHours?: number;
  tags: string[];
}

const Timeline: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'gantt' | 'timeline' | 'dependencies'>('gantt');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Mock data
  const projects = [
    { id: 'all', name: 'Todos los Proyectos', color: 'gray' },
    { id: 'web-redesign', name: 'Rediseño Web', color: 'electric-blue' },
    { id: 'mobile-app', name: 'App Móvil', color: 'electric-purple' },
    { id: 'infrastructure', name: 'Infraestructura', color: 'electric-green' },
    { id: 'marketing', name: 'Marketing', color: 'electric-pink' },
  ];

  const tasks: TimelineTask[] = [
    {
      id: '1',
      title: 'Análisis de Requisitos',
      description: 'Documentar y analizar todos los requisitos del proyecto',
      project: 'web-redesign',
      status: 'completed',
      priority: 'high',
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      duration: 10,
      progress: 100,
      assignees: [
        { id: '1', name: 'Ana García', avatar: '/api/placeholder/32/32' },
        { id: '2', name: 'Carlos López', avatar: '/api/placeholder/32/32' }
      ],
      dependencies: [],
      milestones: [
        { id: '1a', title: 'Requisitos Funcionales', date: '2024-01-20', completed: true },
        { id: '1b', title: 'Requisitos Técnicos', date: '2024-01-25', completed: true }
      ],
      resources: [
        { id: 'analyst', name: 'Analista Senior', allocation: 80 },
        { id: 'pm', name: 'Project Manager', allocation: 20 }
      ],
      estimatedHours: 80,
      actualHours: 75,
      tags: ['análisis', 'requisitos', 'documentación']
    },
    {
      id: '2',
      title: 'Diseño UI/UX',
      description: 'Crear mockups y prototipos de la nueva interfaz',
      project: 'web-redesign',
      status: 'in-progress',
      priority: 'high',
      startDate: '2024-01-26',
      endDate: '2024-02-15',
      duration: 20,
      progress: 65,
      assignees: [
        { id: '3', name: 'María Silva', avatar: '/api/placeholder/32/32' },
        { id: '4', name: 'Diego Ruiz', avatar: '/api/placeholder/32/32' }
      ],
      dependencies: ['1'],
      milestones: [
        { id: '2a', title: 'Wireframes', date: '2024-02-05', completed: true },
        { id: '2b', title: 'Prototipos', date: '2024-02-15', completed: false }
      ],
      resources: [
        { id: 'designer', name: 'UI Designer', allocation: 100 },
        { id: 'ux', name: 'UX Researcher', allocation: 50 }
      ],
      estimatedHours: 160,
      actualHours: 105,
      tags: ['diseño', 'ui', 'ux', 'prototipos']
    },
    {
      id: '3',
      title: 'Desarrollo Frontend',
      description: 'Implementar la nueva interfaz usando React',
      project: 'web-redesign',
      status: 'not-started',
      priority: 'medium',
      startDate: '2024-02-16',
      endDate: '2024-03-30',
      duration: 42,
      progress: 0,
      assignees: [
        { id: '5', name: 'Roberto Kim', avatar: '/api/placeholder/32/32' },
        { id: '6', name: 'Sofía Chen', avatar: '/api/placeholder/32/32' }
      ],
      dependencies: ['2'],
      milestones: [
        { id: '3a', title: 'Componentes Base', date: '2024-03-01', completed: false },
        { id: '3b', title: 'Páginas Principales', date: '2024-03-15', completed: false },
        { id: '3c', title: 'Testing & Polish', date: '2024-03-30', completed: false }
      ],
      resources: [
        { id: 'frontend', name: 'Frontend Developer', allocation: 100 },
        { id: 'frontend2', name: 'Frontend Developer Jr', allocation: 80 }
      ],
      estimatedHours: 320,
      tags: ['desarrollo', 'frontend', 'react']
    },
    {
      id: '4',
      title: 'Backend Integration',
      description: 'Conectar frontend con APIs existentes',
      project: 'web-redesign',
      status: 'not-started',
      priority: 'medium',
      startDate: '2024-03-15',
      endDate: '2024-04-10',
      duration: 26,
      progress: 0,
      assignees: [
        { id: '7', name: 'Luis Morales', avatar: '/api/placeholder/32/32' }
      ],
      dependencies: ['3'],
      milestones: [
        { id: '4a', title: 'API Integration', date: '2024-03-25', completed: false },
        { id: '4b', title: 'Data Migration', date: '2024-04-05', completed: false },
        { id: '4c', title: 'Performance Testing', date: '2024-04-10', completed: false }
      ],
      resources: [
        { id: 'backend', name: 'Backend Developer', allocation: 100 }
      ],
      estimatedHours: 200,
      tags: ['backend', 'apis', 'integración']
    },
    {
      id: '5',
      title: 'App Nativa iOS',
      description: 'Desarrollar aplicación nativa para iOS',
      project: 'mobile-app',
      status: 'in-progress',
      priority: 'high',
      startDate: '2024-02-01',
      endDate: '2024-04-30',
      duration: 89,
      progress: 30,
      assignees: [
        { id: '8', name: 'Emma Thompson', avatar: '/api/placeholder/32/32' }
      ],
      dependencies: [],
      milestones: [
        { id: '5a', title: 'Core Features', date: '2024-03-01', completed: true },
        { id: '5b', title: 'UI Implementation', date: '2024-04-01', completed: false },
        { id: '5c', title: 'App Store Submission', date: '2024-04-30', completed: false }
      ],
      resources: [
        { id: 'ios', name: 'iOS Developer', allocation: 100 }
      ],
      estimatedHours: 450,
      actualHours: 135,
      tags: ['mobile', 'ios', 'nativo']
    }
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      selectedProject === 'all' || task.project === selectedProject
    );
  }, [tasks, selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'in-progress': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'delayed': return 'bg-electric-orange/20 text-electric-orange border-electric-orange/30';
      case 'blocked': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-electric-red/20 text-electric-red';
      case 'high': return 'bg-electric-orange/20 text-electric-orange';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'low': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const calculateDateWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays * 4, 60); // minimum 60px width
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cronograma de Proyectos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Visualización temporal de tareas y dependencias
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
          >
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Año</option>
          </select>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['gantt', 'timeline', 'dependencies'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'gantt' && 'Gantt'}
                {mode === 'timeline' && 'Timeline'}
                {mode === 'dependencies' && 'Dependencias'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`p-2 rounded-lg transition-colors ${
              showDetails
                ? 'bg-electric-blue text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tareas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTasks.length}</p>
            </div>
            <Target className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredTasks.filter(t => t.status === 'completed').length} completadas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">En Progreso</p>
              <p className="text-2xl font-bold text-electric-blue">
                {filteredTasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round(filteredTasks.filter(t => t.status === 'in-progress').reduce((acc, t) => acc + t.progress, 0) / Math.max(filteredTasks.filter(t => t.status === 'in-progress').length, 1))}% promedio
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Recursos Activos</p>
              <p className="text-2xl font-bold text-electric-purple">
                {filteredTasks.reduce((acc, task) => acc + task.assignees.length, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredTasks.reduce((acc, task) => acc + task.resources.reduce((sum, r) => sum + r.allocation, 0), 0)}% capacidad total
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Días Totales</p>
              <p className="text-2xl font-bold text-electric-green">
                {filteredTasks.reduce((acc, task) => acc + task.duration, 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredTasks.reduce((acc, task) => acc + task.estimatedHours, 0)}h estimadas
          </p>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Vista de Cronograma</h3>
        </div>

        <div className="p-6">
          {viewMode === 'gantt' && (
            <div className="space-y-4 overflow-x-auto">
              {/* Timeline Header */}
              <div className="flex items-center min-w-full">
                <div className="w-80 flex-shrink-0"></div>
                <div className="flex-1 grid grid-cols-12 gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="text-center py-2">
                      {new Date(2024, i).toLocaleDateString('es-ES', { month: 'short' })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center min-w-full p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedTask === task.id
                      ? 'border-electric-blue bg-electric-blue/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                >
                  <div className="w-80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <span className={`inline-block w-3 h-3 rounded-full bg-${getProjectColor(task.project)}`}></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded">
                      <div
                        className={`absolute top-0 h-8 rounded bg-${getProjectColor(task.project)} opacity-60 flex items-center justify-between px-2`}
                        style={{ 
                          width: `${Math.min(task.duration * 8, 100)}%`,
                          left: `${(new Date(task.startDate).getMonth() / 12) * 100}%`
                        }}
                      >
                        <span className="text-xs text-white font-medium">
                          {formatDate(task.startDate)}
                        </span>
                        <span className="text-xs text-white">
                          {task.progress}%
                        </span>
                        <span className="text-xs text-white font-medium">
                          {formatDate(task.endDate)}
                        </span>
                      </div>
                      
                      {/* Progress Overlay */}
                      <div
                        className={`absolute top-0 h-8 rounded bg-${getProjectColor(task.project)} opacity-90`}
                        style={{ 
                          width: `${(Math.min(task.duration * 8, 100) * task.progress) / 100}%`,
                          left: `${(new Date(task.startDate).getMonth() / 12) * 100}%`
                        }}
                      ></div>

                      {/* Milestones */}
                      {task.milestones.map(milestone => (
                        <div
                          key={milestone.id}
                          className={`absolute top-0 w-2 h-8 rounded ${
                            milestone.completed ? 'bg-electric-green' : 'bg-electric-yellow'
                          }`}
                          style={{ 
                            left: `${(new Date(milestone.date).getMonth() / 12) * 100}%`,
                            transform: 'translateX(-50%)'
                          }}
                          title={milestone.title}
                        ></div>
                      ))}
                    </div>

                    {/* Assignees */}
                    <div className="flex items-center gap-1 mt-2">
                      {task.assignees.slice(0, 3).map(assignee => (
                        <img
                          key={assignee.id}
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                          title={assignee.name}
                        />
                      ))}
                      {task.assignees.length > 3 && (
                        <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-xs flex items-center justify-center text-gray-600 dark:text-gray-300">
                          +{task.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="space-y-6">
              {filteredTasks
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className={`w-4 h-4 rounded-full bg-${getProjectColor(task.project)} flex-shrink-0 mt-1`}></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {task.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                        <span>📅 {formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
                        <span>⏱️ {task.duration} días</span>
                        <span>📊 {task.progress}%</span>
                        <span>👥 {task.assignees.length} asignados</span>
                      </div>

                      {task.milestones.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Hitos:</p>
                          <div className="flex flex-wrap gap-2">
                            {task.milestones.map(milestone => (
                              <span
                                key={milestone.id}
                                className={`px-2 py-1 text-xs rounded ${
                                  milestone.completed
                                    ? 'bg-electric-green/20 text-electric-green'
                                    : 'bg-electric-yellow/20 text-electric-yellow'
                                }`}
                              >
                                {milestone.completed ? '✓' : '○'} {milestone.title} ({formatDate(milestone.date)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {viewMode === 'dependencies' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Visualización de dependencias entre tareas
              </div>
              {filteredTasks
                .filter(task => task.dependencies.length > 0 || filteredTasks.some(t => t.dependencies.includes(task.id)))
                .map(task => (
                  <div
                    key={task.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    {task.dependencies.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Depende de:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {task.dependencies.map(depId => {
                            const depTask = tasks.find(t => t.id === depId);
                            return depTask ? (
                              <span
                                key={depId}
                                className="px-2 py-1 text-xs rounded bg-electric-blue/20 text-electric-blue"
                              >
                                → {depTask.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {filteredTasks.some(t => t.dependencies.includes(task.id)) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Bloquea a:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {filteredTasks
                            .filter(t => t.dependencies.includes(task.id))
                            .map(depTask => (
                              <span
                                key={depTask.id}
                                className="px-2 py-1 text-xs rounded bg-electric-purple/20 text-electric-purple"
                              >
                                {depTask.title} ←
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Details Panel */}
      {showDetails && selectedTask && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {(() => {
            const task = filteredTasks.find(t => t.id === selectedTask);
            if (!task) return null;

            return (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-electric-blue transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-electric-red transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Información General
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Estado:</span>
                          <span className={`px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prioridad:</span>
                          <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progreso:</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duración:</span>
                          <span>{task.duration} días</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Fechas
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Inicio:</span>
                          <span>{formatDate(task.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fin:</span>
                          <span>{formatDate(task.endDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Recursos
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Horas Estimadas:</span>
                          <span>{task.estimatedHours}h</span>
                        </div>
                        {task.actualHours && (
                          <div className="flex justify-between">
                            <span>Horas Reales:</span>
                            <span>{task.actualHours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Asignados ({task.assignees.length})
                      </p>
                      <div className="space-y-2">
                        {task.assignees.map(assignee => (
                          <div key={assignee.id} className="flex items-center gap-3">
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-sm">{assignee.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {task.milestones.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Hitos ({task.milestones.length})
                        </p>
                        <div className="space-y-2">
                          {task.milestones.map(milestone => (
                            <div key={milestone.id} className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${
                                milestone.completed ? 'bg-electric-green' : 'bg-electric-yellow'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{milestone.title}</p>
                                <p className="text-xs text-gray-500">{formatDate(milestone.date)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Etiquetas
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Timeline;