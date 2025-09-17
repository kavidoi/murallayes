import React, { useState, useEffect, useCallback } from 'react'
import { projectsService, type Project, type ProjectKind } from '../../../services/projectsService'

// Types
interface ProjectSummary extends Project {
  tasksCount: number
  completedTasks: number
  progressPercent: number
  budgetCount: number
  totalBudget: number
  spentBudget: number
  budgetHealth: 'healthy' | 'warning' | 'critical'
  daysUntilDeadline?: number
  isOverdue: boolean
}

interface NewProjectForm {
  name: string
  description: string
  kind: ProjectKind
  deadline: string
}

const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [newProject, setNewProject] = useState<NewProjectForm>({
    name: '',
    description: '',
    kind: 'DEADLINE',
    deadline: ''
  })
  
  // View states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'deadline' | 'budget'>('name')

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectsService.getAllProjects()
      
      // Enhance projects with calculated data
      const enhanced = data.map(project => {
        const tasksCount = project.tasks?.length || 0
        const completedTasks = project.tasks?.filter(t => t.status === 'DONE').length || 0
        const progressPercent = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0
        
        const budgetCount = project.budgets?.length || 0
        const totalBudget = project.budgets?.reduce((sum, b) => sum + Number(b.totalPlanned), 0) || 0
        const spentBudget = project.budgets?.reduce((sum, b) => sum + Number(b.totalActual), 0) || 0
        
        const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0
        const budgetHealth: 'healthy' | 'warning' | 'critical' = 
          budgetUtilization > 100 ? 'critical' :
          budgetUtilization > 80 ? 'warning' : 'healthy'
        
        let daysUntilDeadline: number | undefined
        let isOverdue = false
        
        if (project.deadline) {
          const deadline = new Date(project.deadline)
          const now = new Date()
          const diffTime = deadline.getTime() - now.getTime()
          daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          isOverdue = daysUntilDeadline < 0
        }

        return {
          ...project,
          tasksCount,
          completedTasks,
          progressPercent,
          budgetCount,
          totalBudget,
          spentBudget,
          budgetHealth,
          daysUntilDeadline,
          isOverdue
        } as ProjectSummary
      })

      setProjects(enhanced)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Error loading projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return
    
    try {
      await projectsService.createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
        kind: newProject.kind,
        deadline: newProject.kind === 'DEADLINE' && newProject.deadline ? newProject.deadline : undefined,
      })
      
      setNewProject({ name: '', description: '', kind: 'DEADLINE', deadline: '' })
      setShowCreateForm(false)
      await loadProjects()
    } catch (err: any) {
      setError(err?.message || 'Error creating project')
    }
  }

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await projectsService.updateProject(projectId, updates)
      await loadProjects()
      setEditingProject(null)
    } catch (err: any) {
      setError(err?.message || 'Error updating project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción eliminará todas las tareas y presupuestos asociados.')) {
      return
    }
    
    try {
      await projectsService.deleteProject(projectId)
      await loadProjects()
    } catch (err: any) {
      setError(err?.message || 'Error deleting project')
    }
  }

  const getFilteredProjects = () => {
    let filtered = projects

    // Apply status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(p => p.progressPercent < 100 && !p.isOverdue)
        break
      case 'completed':
        filtered = filtered.filter(p => p.progressPercent === 100)
        break
      case 'overdue':
        filtered = filtered.filter(p => p.isOverdue)
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progressPercent - a.progressPercent
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'budget':
          return b.totalBudget - a.totalBudget
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }

  const ProjectCard: React.FC<{ project: ProjectSummary }> = ({ project }) => {
    const isEditing = editingProject === project.id
    const [editName, setEditName] = useState(project.name)
    const [editDescription, setEditDescription] = useState(project.description || '')
    const [editKind, setEditKind] = useState<ProjectKind>(project.kind || 'DEADLINE')
    const [editDeadline, setEditDeadline] = useState(
      project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
    )

    const handleSaveEdit = () => {
      handleUpdateProject(project.id, {
        name: editName,
        description: editDescription,
        kind: editKind,
        deadline: editKind === 'DEADLINE' && editDeadline ? editDeadline : undefined
      })
    }

    const handleCancelEdit = () => {
      setEditName(project.name)
      setEditDescription(project.description || '')
      setEditKind(project.kind || 'DEADLINE')
      setEditDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '')
      setEditingProject(null)
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        {/* Project Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3" onClick={e => e.stopPropagation()}>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full font-semibold text-lg bg-transparent border-b border-blue-500 focus:outline-none"
                    placeholder="Nombre del proyecto"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-blue-500 focus:outline-none resize-none"
                    rows={2}
                    placeholder="Descripción del proyecto"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Proyecto
                      </label>
                      <select
                        value={editKind}
                        onChange={(e) => setEditKind(e.target.value as ProjectKind)}
                        className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DEADLINE">Con fecha límite</option>
                        <option value="CORE">Proyecto principal</option>
                      </select>
                    </div>
                    {editKind === 'DEADLINE' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha Límite
                        </label>
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                          className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project.description || 'Sin descripción'}
                  </p>
                </div>
              )}
            </div>
            
            {!isEditing && (
              <div className="flex items-center gap-2 ml-4">
                {/* Project Status Badge */}
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  project.progressPercent === 100 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : project.isOverdue
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {project.progressPercent === 100 ? 'Completado' : 
                   project.isOverdue ? 'Vencido' : 'Activo'}
                </span>
                
                {/* Project Type Badge */}
                <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {project.kind === 'CORE' ? 'Principal' : 'Con Fecha Límite'}
                </span>
                
                {/* Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProject(project.id)
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Deadline info */}
          {project.deadline && !isEditing && (
            <div className={`mt-2 text-xs flex items-center gap-1 ${
              project.isOverdue 
                ? 'text-red-600 dark:text-red-400'
                : project.daysUntilDeadline && project.daysUntilDeadline <= 7
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {project.isOverdue 
                ? `Vencido hace ${Math.abs(project.daysUntilDeadline!)} días`
                : project.daysUntilDeadline === 0 
                ? 'Vence hoy'
                : project.daysUntilDeadline === 1
                ? 'Vence mañana'
                : `${project.daysUntilDeadline} días restantes`
              }
            </div>
          )}
        </div>

        {/* Project Metrics */}
        {!isEditing && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                  <span className="font-medium">{project.progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      project.progressPercent === 100 
                        ? 'bg-green-500' 
                        : project.progressPercent > 75 
                        ? 'bg-blue-500' 
                        : project.progressPercent > 50 
                        ? 'bg-amber-500' 
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Tareas</div>
                <div className="font-medium">
                  {project.completedTasks}/{project.tasksCount}
                </div>
                <div className="text-xs text-gray-500">
                  {project.tasksCount === 0 ? 'Sin tareas' : 'completadas'}
                </div>
              </div>

              {/* Budget */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Presupuesto</span>
                  <div className={`w-2 h-2 rounded-full ${
                    project.budgetHealth === 'critical' ? 'bg-red-500' :
                    project.budgetHealth === 'warning' ? 'bg-amber-500' :
                    'bg-green-500'
                  }`} />
                </div>
                <div className="font-medium text-xs">
                  {project.budgetCount === 0 ? 'Sin presupuesto' : 
                   `$${project.spentBudget.toLocaleString()}`
                  }
                </div>
                <div className="text-xs text-gray-500">
                  {project.budgetCount === 0 ? '' : 
                   `de $${project.totalBudget.toLocaleString()}`
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const filteredProjects = getFilteredProjects()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            📁 Proyectos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus proyectos, tareas y presupuestos
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Proyectos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.progressPercent === 100).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completados</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">
            {projects.filter(p => p.isOverdue).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Vencidos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">
            {projects.reduce((sum, p) => sum + p.tasksCount, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Tareas</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input"
          >
            <option value="all">Todos los proyectos</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
            <option value="overdue">Vencidos</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="progress">Ordenar por progreso</option>
            <option value="deadline">Ordenar por fecha límite</option>
            <option value="budget">Ordenar por presupuesto</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Cuadrícula
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Proyecto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del proyecto *"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              className="input"
            />
            <select
              value={newProject.kind}
              onChange={(e) => setNewProject({...newProject, kind: e.target.value as ProjectKind})}
              className="input"
            >
              <option value="DEADLINE">Con fecha límite</option>
              <option value="CORE">Proyecto principal</option>
            </select>
            <textarea
              placeholder="Descripción (opcional)"
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              className="input md:col-span-2"
              rows={3}
            />
            {newProject.kind === 'DEADLINE' && (
              <input
                type="date"
                value={newProject.deadline}
                onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                className="input"
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateProject}
              disabled={!newProject.name.trim()}
              className="btn-primary"
            >
              Crear Proyecto
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-200">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline mt-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {filterStatus === 'all' ? 'No hay proyectos' : 'No se encontraron proyectos'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filterStatus === 'all' 
              ? 'Crea tu primer proyecto para comenzar'
              : 'Intenta cambiar los filtros'
            }
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Crear Primer Proyecto
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsManager